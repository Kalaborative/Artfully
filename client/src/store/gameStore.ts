import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import { useAuthStore } from './authStore';
import type {
  GameState,
  GameResults,
  WordChoice,
  Difficulty
} from '@artfully/shared';

interface GameStoreState {
  game: GameState | null;
  results: GameResults | null;
  wordChoices: WordChoice[] | null;
  wordSelectionTimeLimit: number;
  isStarting: boolean;
  startingCountdown: number;
  error: string | null;
  wasKicked: boolean;

  selectWord: (index: number) => void;
  leaveGame: () => void;
  kickPlayer: (userId: string) => void;
  setupListeners: () => () => void;
  reset: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  game: null,
  results: null,
  wordChoices: null,
  wordSelectionTimeLimit: 15,
  isStarting: false,
  startingCountdown: 0,
  error: null,
  wasKicked: false,

  selectWord: (index: number) => {
    const socket = getSocket();
    socket.emit('game:select_word', index);
    set({ wordChoices: null });
  },

  leaveGame: () => {
    const socket = getSocket();
    socket.emit('game:leave');
    set({ game: null, results: null });
  },

  kickPlayer: (userId: string) => {
    const socket = getSocket();
    socket.emit('lobby:kick', userId);
  },

  setupListeners: () => {
    const socket = getSocket();

    const handleGameStarting = ({ countdown }: { countdown: number }) => {
      console.log('[Client] game:starting received, countdown:', countdown);
      set({ isStarting: true, startingCountdown: countdown });
      console.log('[Client] gameStore state after set:', { isStarting: get().isStarting, game: !!get().game });

      const interval = setInterval(() => {
        const { startingCountdown } = get();
        if (startingCountdown <= 1) {
          clearInterval(interval);
          set({ isStarting: false, startingCountdown: 0 });
        } else {
          set({ startingCountdown: startingCountdown - 1 });
        }
      }, 1000);
    };

    const handleGameStarted = ({ game }: { game: GameState }) => {
      console.log('[Client] game:started received, gameId:', game.id);
      set({ game, isStarting: false });
      console.log('[Client] gameStore state after game:started set:', { isStarting: get().isStarting, game: !!get().game });
    };

    const handleGameEnded = ({ results }: { results: GameResults }) => {
      set({ results, game: null });
    };

    const handleRoundStart = ({ roundNumber, drawerId, totalTime }: { roundNumber: number; drawerId: string; totalTime: number }) => {
      const { game } = get();
      if (!game) return;

      set({
        game: {
          ...game,
          currentRound: roundNumber,
          currentDrawerId: drawerId,
          players: game.players.map(p => ({
            ...p,
            isDrawing: p.userId === drawerId,
            hasGuessedCorrectly: false
          })),
          roundState: {
            roundNumber,
            drawerId,
            word: null,
            maskedWord: '',
            difficulty: null,
            timeRemaining: totalTime,
            totalTime,
            hintsRevealed: 0,
            guessersRemaining: game.players.length - 1,
            firstGuessTime: null,
            correctGuessers: [],
            phase: 'word_selection'
          }
        },
        wordChoices: null
      });
    };

    const handleWordSelection = ({ choices, timeLimit }: { choices: WordChoice[]; timeLimit: number }) => {
      set({ wordChoices: choices, wordSelectionTimeLimit: timeLimit });
    };

    const handleWordSelected = ({ difficulty, maskedWord }: { difficulty: Difficulty; wordLength: number; maskedWord: string }) => {
      const { game } = get();
      if (!game?.roundState) return;

      set({
        game: {
          ...game,
          roundState: {
            ...game.roundState,
            difficulty,
            maskedWord,
            phase: 'drawing'
          }
        },
        wordChoices: null
      });
    };

    const handleTimerUpdate = ({ timeRemaining }: { timeRemaining: number; timerHalved: boolean }) => {
      const { game } = get();
      if (!game?.roundState) return;

      set({
        game: {
          ...game,
          roundState: {
            ...game.roundState,
            timeRemaining
          }
        }
      });
    };

    const handleHintReveal = ({ maskedWord, hintsRevealed }: { maskedWord: string; hintsRevealed: number }) => {
      const { game } = get();
      if (!game?.roundState) return;

      // Don't overwrite the drawer's full word with a masked version
      const currentUserId = useAuthStore.getState().user?.$id;
      const isDrawer = game.currentDrawerId === currentUserId;

      set({
        game: {
          ...game,
          roundState: {
            ...game.roundState,
            maskedWord: isDrawer ? game.roundState.maskedWord : maskedWord,
            hintsRevealed
          }
        }
      });
    };

    const handleCorrectGuess = ({ userId, points, guessersRemaining }: { userId: string; username: string; points: number; isFirst: boolean; guessOrder: number; guessersRemaining: number }) => {
      const { game } = get();
      if (!game?.roundState) return;

      set({
        game: {
          ...game,
          players: game.players.map(p =>
            p.userId === userId
              ? { ...p, hasGuessedCorrectly: true, points: p.points + points }
              : p
          ),
          roundState: {
            ...game.roundState,
            correctGuessers: [...game.roundState.correctGuessers, userId],
            guessersRemaining
          }
        }
      });
    };

    const handleRoundEnd = ({ word, scores }: { word: string; drawerPoints: number; guessers: any[]; scores: Array<{ userId: string; totalPoints: number }> }) => {
      const { game } = get();
      if (!game?.roundState) return;

      const scoresMap = new Map(scores.map(s => [s.userId, s.totalPoints]));

      set({
        game: {
          ...game,
          players: game.players.map(p => ({
            ...p,
            points: scoresMap.get(p.userId) ?? p.points
          })),
          roundState: {
            ...game.roundState,
            word,
            phase: 'round_end'
          }
        }
      });
    };

    const handlePlayerLeft = ({ userId }: { userId: string; username: string }) => {
      const { game } = get();
      if (!game) return;

      set({
        game: {
          ...game,
          players: game.players.map(p =>
            p.userId === userId ? { ...p, isConnected: false } : p
          )
        }
      });
    };

    const handleKicked = () => {
      set({ game: null, results: null, wasKicked: true });
    };

    socket.on('game:starting', handleGameStarting);
    socket.on('game:started', handleGameStarted);
    socket.on('game:ended', handleGameEnded);
    socket.on('game:player_left', handlePlayerLeft);
    socket.on('round:start', handleRoundStart);
    socket.on('round:word_selection', handleWordSelection);
    socket.on('round:word_selected', handleWordSelected);
    socket.on('round:timer_update', handleTimerUpdate);
    socket.on('round:hint_reveal', handleHintReveal);
    socket.on('round:correct_guess', handleCorrectGuess);
    socket.on('round:end', handleRoundEnd);
    socket.on('lobby:kicked', handleKicked);

    return () => {
      socket.off('game:starting', handleGameStarting);
      socket.off('game:started', handleGameStarted);
      socket.off('game:ended', handleGameEnded);
      socket.off('game:player_left', handlePlayerLeft);
      socket.off('round:start', handleRoundStart);
      socket.off('round:word_selection', handleWordSelection);
      socket.off('round:word_selected', handleWordSelected);
      socket.off('round:timer_update', handleTimerUpdate);
      socket.off('round:hint_reveal', handleHintReveal);
      socket.off('round:correct_guess', handleCorrectGuess);
      socket.off('round:end', handleRoundEnd);
      socket.off('lobby:kicked', handleKicked);
    };
  },

  reset: () => {
    set({
      game: null,
      results: null,
      wordChoices: null,
      isStarting: false,
      startingCountdown: 0,
      error: null,
      wasKicked: false
    });
  }
}));
