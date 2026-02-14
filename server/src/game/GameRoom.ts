import { Server } from 'socket.io';
import type {
  GameState,
  GamePlayer,
  GameMode,
  Difficulty,
  WordChoice,
  RoundState,
  Stroke,
  ChatMessagePayload,
  ChatGuessPayload,
  ChatCorrectGuessPayload,
  CanvasStrokeStartPayload,
  CanvasStrokeDataPayload,
  CanvasStrokeEndPayload,
  CanvasFillPayload,
  CanvasClearPayload,
  CanvasUndoPayload,
  LobbyPlayer,
  ClientToServerEvents,
  ServerToClientEvents
} from '@artfully/shared';
import { GAME_MODE_CONFIG, TIMER_CONFIG, LOBBY_CONFIG } from '@artfully/shared';
import { PointCalculator } from './PointCalculator.js';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import WORD_BANK from '../data/words.js';

interface RoundGuesser {
  userId: string;
  username: string;
  points: number;
  guessOrder: number;
  timeRemaining: number;
}

export class GameRoom {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private roomId: string;
  private lobbyId: string;
  private gameMode: GameMode;
  private totalRounds: number;
  private maxPoints: number;
  private currentRound: number = 0;
  private turnOrder: string[] = [];
  private currentTurnIndex: number = 0;
  private currentDrawerId: string | null = null;
  private players: Map<string, GamePlayer> = new Map();
  private roundState: RoundState | null = null;
  private wordChoices: WordChoice[] = [];
  private roundTimer: NodeJS.Timeout | null = null;
  private wordSelectionTimer: NodeJS.Timeout | null = null;
  private roundGuessers: RoundGuesser[] = [];
  private strokes: string[] = [];
  private pointCalculator: PointCalculator;
  private isEnded: boolean = false;

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    lobbyId: string,
    gameMode: GameMode,
    lobbyPlayers: LobbyPlayer[]
  ) {
    this.io = io;
    this.lobbyId = lobbyId;
    this.roomId = `game:${lobbyId}`;
    this.gameMode = gameMode;
    this.totalRounds = GAME_MODE_CONFIG[gameMode].rounds * lobbyPlayers.length;
    this.maxPoints = GAME_MODE_CONFIG[gameMode].maxPoints;
    this.pointCalculator = new PointCalculator();

    // Initialize players
    for (const player of lobbyPlayers) {
      this.players.set(player.userId, {
        userId: player.userId,
        username: player.username,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        countryCode: player.countryCode,
        points: 0,
        correctGuesses: 0,
        firstGuesses: 0,
        isDrawing: false,
        hasGuessedCorrectly: false,
        isConnected: true
      });
    }

    // Randomize turn order
    this.turnOrder = this.shuffleArray(Array.from(this.players.keys()));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async start(): Promise<void> {
    // Emit game starting countdown
    this.io.to(this.roomId).emit('game:starting', {
      countdown: LOBBY_CONFIG.GAME_START_COUNTDOWN
    });

    // Wait for countdown
    await new Promise(resolve => setTimeout(resolve, LOBBY_CONFIG.GAME_START_COUNTDOWN * 1000));

    // Emit game started
    this.io.to(this.roomId).emit('game:started', { game: this.getState() });

    // Start first round
    this.startRound();
  }

  private async startRound(): Promise<void> {
    this.currentRound++;

    if (this.currentRound > this.totalRounds) {
      this.endGame();
      return;
    }

    // Reset round state
    this.roundGuessers = [];
    this.strokes = [];

    // Get current drawer
    const drawerIndex = (this.currentRound - 1) % this.turnOrder.length;
    const drawerId = this.turnOrder[drawerIndex];
    const drawer = this.players.get(drawerId);

    if (!drawer) {
      this.startRound(); // Skip if drawer left
      return;
    }

    // Set current drawer immediately so it's available during word selection
    this.currentDrawerId = drawerId;

    // Update player states
    for (const player of this.players.values()) {
      player.isDrawing = player.userId === drawerId;
      player.hasGuessedCorrectly = false;
    }

    // Emit round start
    this.io.to(this.roomId).emit('round:start', {
      roundNumber: this.currentRound,
      drawerId,
      totalTime: GAME_MODE_CONFIG[this.gameMode].drawingTime
    });

    // Get word choices
    await this.fetchWordChoices();

    // Send word selection to drawer only
    const drawerSocket = this.getPlayerSocket(drawerId);
    if (drawerSocket) {
      drawerSocket.emit('round:word_selection', {
        choices: this.wordChoices,
        timeLimit: GAME_MODE_CONFIG[this.gameMode].wordSelectionTime
      });
    }

    // Start word selection timer
    this.wordSelectionTimer = setTimeout(() => {
      // Auto-select first word if not selected
      if (!this.roundState?.word) {
        this.selectWord(0);
      }
    }, GAME_MODE_CONFIG[this.gameMode].wordSelectionTime * 1000);
  }

  private async fetchWordChoices(): Promise<void> {
    try {
      const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
      this.wordChoices = [];

      for (const difficulty of difficulties) {
        const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WORDS, [
          Query.equal('difficulty', difficulty),
          Query.equal('isActive', true),
          Query.limit(100)
        ]);

        if (result.documents.length > 0) {
          const randomIndex = Math.floor(Math.random() * result.documents.length);
          const doc = result.documents[randomIndex];
          this.wordChoices.push({
            word: doc.word as string,
            difficulty: doc.difficulty as Difficulty,
            category: doc.category as string
          });
        }
      }

      // Fallback to local word bank if not enough words from database
      if (this.wordChoices.length < 3) {
        this.wordChoices = this.getWordsFromLocalBank();
      }
    } catch (error) {
      console.error('Error fetching words from database, using local bank:', error);
      this.wordChoices = this.getWordsFromLocalBank();
    }
  }

  private getWordsFromLocalBank(): WordChoice[] {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    const choices: WordChoice[] = [];

    for (const difficulty of difficulties) {
      const wordsOfDifficulty = WORD_BANK.filter(w => w.difficulty === difficulty);
      if (wordsOfDifficulty.length > 0) {
        const randomWord = wordsOfDifficulty[Math.floor(Math.random() * wordsOfDifficulty.length)];
        choices.push({
          word: randomWord.word,
          difficulty: randomWord.difficulty,
          category: randomWord.category
        });
      }
    }

    return choices;
  }

  selectWord(index: number): void {
    if (this.wordSelectionTimer) {
      clearTimeout(this.wordSelectionTimer);
      this.wordSelectionTimer = null;
    }

    const choice = this.wordChoices[index] || this.wordChoices[0];
    const drawerId = this.currentDrawerId;

    if (!drawerId) return;

    this.roundState = {
      roundNumber: this.currentRound,
      drawerId,
      word: choice.word,
      maskedWord: this.maskWord(choice.word, 0),
      difficulty: choice.difficulty,
      timeRemaining: GAME_MODE_CONFIG[this.gameMode].drawingTime,
      totalTime: GAME_MODE_CONFIG[this.gameMode].drawingTime,
      hintsRevealed: 0,
      guessersRemaining: this.players.size - 1,
      firstGuessTime: null,
      correctGuessers: [],
      phase: 'drawing'
    };

    // Clear canvas for new round
    this.clearCanvas();
    this.io.to(this.roomId).emit('canvas:clear', {
      userId: drawerId,
      timestamp: Date.now()
    });

    // Notify guessers with masked word
    const drawerSocket = this.getPlayerSocket(drawerId);
    if (drawerSocket) {
      // Send the actual word to the drawer
      drawerSocket.emit('round:word_selected', {
        difficulty: choice.difficulty,
        wordLength: choice.word.length,
        maskedWord: choice.word
      });
      // Send masked word to everyone else in the room
      drawerSocket.to(this.roomId).emit('round:word_selected', {
        difficulty: choice.difficulty,
        wordLength: choice.word.length,
        maskedWord: this.roundState.maskedWord
      });
    } else {
      // Fallback: send masked word to all
      this.io.to(this.roomId).emit('round:word_selected', {
        difficulty: choice.difficulty,
        wordLength: choice.word.length,
        maskedWord: this.roundState.maskedWord
      });
    }

    // Start drawing timer
    this.startDrawingTimer();
  }

  private maskWord(word: string, hintsRevealed: number): string {
    if (hintsRevealed === 0) {
      return word.split('').map(char => char === ' ' ? ' ' : '_').join('');
    }

    const chars = word.split('');
    const letterIndices = chars
      .map((char, i) => char !== ' ' ? i : -1)
      .filter(i => i !== -1);

    const hintsToShow = Math.min(hintsRevealed, Math.floor(letterIndices.length / 3));
    const revealedIndices = new Set<number>();

    // Deterministically reveal hints based on word
    for (let i = 0; i < hintsToShow; i++) {
      const idx = letterIndices[Math.floor((i * letterIndices.length) / hintsToShow)];
      revealedIndices.add(idx);
    }

    return chars.map((char, i) => {
      if (char === ' ') return ' ';
      if (revealedIndices.has(i)) return char;
      return '_';
    }).join('');
  }

  private startDrawingTimer(): void {
    this.roundTimer = setInterval(() => {
      if (!this.roundState) return;

      this.roundState.timeRemaining--;

      // Check for hint reveals
      const hintsToReveal = TIMER_CONFIG.HINT_REVEAL_TIMES.filter(
        t => this.roundState!.timeRemaining <= t
      ).length;

      if (hintsToReveal > this.roundState.hintsRevealed && this.roundState.word) {
        this.roundState.hintsRevealed = hintsToReveal;
        this.roundState.maskedWord = this.maskWord(this.roundState.word, hintsToReveal);

        this.io.to(this.roomId).emit('round:hint_reveal', {
          maskedWord: this.roundState.maskedWord,
          hintsRevealed: this.roundState.hintsRevealed
        });
      }

      this.io.to(this.roomId).emit('round:timer_update', {
        timeRemaining: this.roundState.timeRemaining,
        timerHalved: this.roundState.firstGuessTime !== null
      });

      if (this.roundState.timeRemaining <= 0 || this.roundState.guessersRemaining <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  checkGuess(userId: string, guess: string): { correct: boolean; points: number; isFirst: boolean; guessOrder: number } {
    if (!this.roundState?.word) {
      return { correct: false, points: 0, isFirst: false, guessOrder: 0 };
    }

    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedWord = this.roundState.word.toLowerCase().trim();

    if (normalizedGuess !== normalizedWord) {
      return { correct: false, points: 0, isFirst: false, guessOrder: 0 };
    }

    const player = this.players.get(userId);
    if (!player || player.hasGuessedCorrectly) {
      return { correct: false, points: 0, isFirst: false, guessOrder: 0 };
    }

    player.hasGuessedCorrectly = true;
    player.correctGuesses++;

    const isFirst = this.roundGuessers.length === 0;
    const guessOrder = this.roundGuessers.length + 1;

    if (isFirst) {
      this.roundState.firstGuessTime = this.roundState.timeRemaining;
      player.firstGuesses++;

      // Halve the timer
      if (TIMER_CONFIG.TIMER_HALVE_ON_FIRST_GUESS) {
        this.roundState.timeRemaining = Math.max(
          TIMER_CONFIG.MIN_TIME_AFTER_HALVE,
          Math.floor(this.roundState.timeRemaining / 2)
        );
      }
    }

    const points = this.pointCalculator.calculateGuesserPoints(
      guessOrder,
      this.roundState.timeRemaining,
      this.roundState.firstGuessTime,
      this.maxPoints,
      this.roundState.difficulty!
    );

    player.points += points;

    this.roundGuessers.push({
      userId,
      username: player.username,
      points,
      guessOrder,
      timeRemaining: this.roundState.timeRemaining
    });

    this.roundState.correctGuessers.push(userId);
    this.roundState.guessersRemaining--;

    // Broadcast correct guess
    this.io.to(this.roomId).emit('round:correct_guess', {
      userId,
      username: player.username,
      points,
      isFirst,
      guessOrder,
      guessersRemaining: this.roundState.guessersRemaining
    });

    // Check if round should end
    if (this.roundState.guessersRemaining <= 0) {
      this.endRound();
    }

    return { correct: true, points, isFirst, guessOrder };
  }

  private endRound(): void {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }

    if (!this.roundState) return;

    this.roundState.phase = 'round_end';

    // Calculate drawer points
    const drawer = this.players.get(this.roundState.drawerId);
    if (drawer && this.roundState.difficulty) {
      const maxGuessers = this.players.size - 1;
      const drawerPoints = this.pointCalculator.calculateDrawerPoints(
        this.roundGuessers.length,
        maxGuessers,
        this.maxPoints,
        this.roundState.difficulty
      );
      drawer.points += drawerPoints;

      // Emit round end
      this.io.to(this.roomId).emit('round:end', {
        word: this.roundState.word!,
        drawerPoints,
        guessers: this.roundGuessers.map(g => ({
          userId: g.userId,
          username: g.username,
          points: g.points,
          guessOrder: g.guessOrder
        })),
        scores: Array.from(this.players.values()).map(p => ({
          userId: p.userId,
          totalPoints: p.points
        }))
      });
    }

    // Start next round after delay
    setTimeout(() => {
      if (!this.isEnded) {
        this.startRound();
      }
    }, 5000);
  }

  private async endGame(): Promise<void> {
    this.isEnded = true;

    // Sort players by points
    const sortedPlayers = Array.from(this.players.values())
      .sort((a, b) => b.points - a.points);

    // Emit game ended
    this.io.to(this.roomId).emit('game:ended', {
      results: {
        gameId: this.lobbyId,
        players: sortedPlayers.map((p, index) => ({
          userId: p.userId,
          username: p.username,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          countryCode: p.countryCode,
          rank: index + 1,
          totalPoints: p.points,
          correctGuesses: p.correctGuesses,
          firstGuesses: p.firstGuesses,
          roundsDrawn: Math.floor(this.currentRound / this.players.size),
          pointsGained: p.points
        })),
        totalRounds: this.currentRound - 1,
        gameMode: this.gameMode,
        duration: 0 // Could calculate actual duration
      }
    });

    // Update player statistics in database
    this.updatePlayerStatistics(sortedPlayers).catch(err =>
      console.error('[GameRoom] Failed to update player statistics:', err)
    );
  }

  private async updatePlayerStatistics(sortedPlayers: GamePlayer[]): Promise<void> {
    try {
      const updates = sortedPlayers.map(async (player, index) => {
        const docs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STATISTICS, [
          Query.equal('userId', player.userId)
        ]);

        if (docs.documents.length === 0) return;

        const doc = docs.documents[0] as any;
        const isWinner = index === 0 && player.points > 0;

        await databases.updateDocument(DATABASE_ID, COLLECTIONS.USER_STATISTICS, doc.$id, {
          gamesPlayed: (doc.gamesPlayed || 0) + 1,
          gamesWon: (doc.gamesWon || 0) + (isWinner ? 1 : 0),
          totalPoints: (doc.totalPoints || 0) + player.points,
        });
      });

      await Promise.allSettled(updates);
    } catch (err) {
      console.error('[GameRoom] Error updating player statistics:', err);
    }

    // Recompute ranks after stats update (fire-and-forget)
    this.recomputeRanks().catch(err =>
      console.error('[GameRoom] Failed to recompute ranks:', err)
    );
  }

  private async recomputeRanks(): Promise<void> {
    try {
      // Fetch all user_statistics sorted by totalPoints descending
      const allStats: any[] = [];
      let offset = 0;
      const limit = 100;

      while (true) {
        const batch = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STATISTICS, [
          Query.orderDesc('totalPoints'),
          Query.limit(limit),
          Query.offset(offset),
        ]);
        allStats.push(...batch.documents);
        if (batch.documents.length < limit) break;
        offset += limit;
      }

      // Assign worldRank (1-indexed)
      const rankUpdates: Promise<any>[] = [];

      // Fetch profiles for countryRank grouping
      const userIds = allStats.map(s => s.userId);
      const profileMap = new Map<string, string>(); // userId -> countryCode

      for (let i = 0; i < userIds.length; i += 100) {
        const chunk = userIds.slice(i, i + 100);
        const profiles = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
          Query.equal('userId', chunk),
          Query.limit(100),
        ]);
        for (const p of profiles.documents as any[]) {
          if (p.countryCode) {
            profileMap.set(p.userId, p.countryCode);
          }
        }
      }

      // Group by country for countryRank
      const countryCounters = new Map<string, number>();

      for (let i = 0; i < allStats.length; i++) {
        const stat = allStats[i];
        const worldRank = i + 1;
        const countryCode = profileMap.get(stat.userId);

        let countryRank: number | undefined;
        if (countryCode) {
          const current = (countryCounters.get(countryCode) || 0) + 1;
          countryCounters.set(countryCode, current);
          countryRank = current;
        }

        // Only update if rank changed
        if (stat.worldRank !== worldRank || stat.countryRank !== countryRank) {
          rankUpdates.push(
            databases.updateDocument(DATABASE_ID, COLLECTIONS.USER_STATISTICS, stat.$id, {
              worldRank,
              ...(countryRank !== undefined ? { countryRank } : {}),
            })
          );
        }
      }

      await Promise.allSettled(rankUpdates);
    } catch (err) {
      console.error('[GameRoom] Error recomputing ranks:', err);
    }
  }

  getCurrentDrawerId(): string | null {
    return this.currentDrawerId;
  }

  hasPlayerGuessed(userId: string): boolean {
    const player = this.players.get(userId);
    return player?.hasGuessedCorrectly ?? false;
  }

  getState(): GameState {
    return {
      id: this.lobbyId,
      lobbyId: this.lobbyId,
      gameMode: this.gameMode,
      totalRounds: this.totalRounds,
      currentRound: this.currentRound,
      status: this.isEnded ? 'completed' : 'in_progress',
      players: Array.from(this.players.values()),
      turnOrder: this.turnOrder,
      currentDrawerId: this.getCurrentDrawerId(),
      roundState: this.roundState
    };
  }

  // Canvas methods
  addStroke(strokeId: string): void {
    this.strokes.push(strokeId);
  }

  clearCanvas(): void {
    this.strokes = [];
  }

  undoStroke(): string | null {
    return this.strokes.pop() || null;
  }

  broadcastCanvasEvent(
    event: 'canvas:stroke_start' | 'canvas:stroke_data' | 'canvas:stroke_end' | 'canvas:fill' | 'canvas:clear' | 'canvas:undo',
    data: CanvasStrokeStartPayload | CanvasStrokeDataPayload | CanvasStrokeEndPayload | CanvasFillPayload | CanvasClearPayload | CanvasUndoPayload,
    excludeUserId?: string
  ): void {
    if (excludeUserId) {
      const socket = this.getPlayerSocket(excludeUserId);
      if (!socket) {
        console.log('[GameRoom] broadcastCanvasEvent: No socket found for excludeUserId', excludeUserId);
        return;
      }
      const room = this.io.sockets.adapter.rooms.get(this.roomId);
      console.log('[GameRoom] broadcastCanvasEvent:', event, 'roomId:', this.roomId, 'room size:', room?.size, 'members:', room ? Array.from(room) : []);
      socket.to(this.roomId).emit(event, data as any);
    } else {
      this.io.to(this.roomId).emit(event, data as any);
    }
  }

  // Chat methods
  broadcastChatMessage(message: ChatMessagePayload): void {
    this.io.to(this.roomId).emit('chat:message', message);
  }

  broadcastGuessAttempt(guess: ChatGuessPayload): void {
    // Send to players who haven't guessed yet (and aren't the drawer)
    for (const player of this.players.values()) {
      if (!player.hasGuessedCorrectly && player.userId !== this.getCurrentDrawerId()) {
        const socket = this.getPlayerSocket(player.userId);
        socket?.emit('chat:guess', guess);
      }
    }
  }

  broadcastToCorrectGuessers(message: ChatMessagePayload): void {
    // Send to players who have already guessed correctly
    for (const player of this.players.values()) {
      if (player.hasGuessedCorrectly) {
        const socket = this.getPlayerSocket(player.userId);
        socket?.emit('chat:message', message);
      }
    }
  }

  broadcastCorrectGuess(data: ChatCorrectGuessPayload): void {
    this.io.to(this.roomId).emit('chat:correct_guess', data);
  }

  getPlayerSocket(userId: string): any {
    const sockets = this.io.sockets.sockets;
    for (const [, socket] of sockets) {
      if ((socket as any).userId === userId) {
        return socket;
      }
    }
    return null;
  }

  handlePlayerDisconnect(userId: string): void {
    const player = this.players.get(userId);
    if (player) {
      player.isConnected = false;

      this.io.to(this.roomId).emit('game:player_left', {
        userId,
        username: player.username
      });

      // If drawer left, end round early
      if (this.getCurrentDrawerId() === userId) {
        this.endRound();
      }

      // Check if game should end (less than 2 connected players)
      const connectedPlayers = Array.from(this.players.values()).filter(p => p.isConnected);
      if (connectedPlayers.length < 2) {
        this.endGame();
      }
    }
  }

  getRoomId(): string {
    return this.roomId;
  }
}
