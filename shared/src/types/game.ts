export type GameMode = 'normal' | 'quick';
export type GameStatus = 'in_progress' | 'completed' | 'abandoned';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Word {
  id: string;
  word: string;
  difficulty: Difficulty;
  category: string;
  hint?: string;
  timesUsed: number;
  timesGuessed: number;
  isActive: boolean;
}

export interface WordChoice {
  word: string;
  difficulty: Difficulty;
  category: string;
}

export interface Game {
  id: string;
  lobbyId: string;
  gameMode: GameMode;
  totalRounds: number;
  maxPoints: number;
  status: GameStatus;
  currentRound: number;
  currentDrawerId: string | null;
  currentWord: string | null;
  turnOrder: string[];
  startedAt: string;
  endedAt?: string;
}

export interface GameParticipant {
  id: string;
  gameId: string;
  userId: string;
  totalPoints: number;
  correctGuesses: number;
  firstGuesses: number;
  roundsDrawn: number;
  finalRank?: number;
  leftEarly: boolean;
}

export interface GameRound {
  id: string;
  gameId: string;
  roundNumber: number;
  drawerId: string;
  word: string;
  difficulty: Difficulty;
  drawerPoints: number;
  totalCorrectGuesses: number;
  firstGuesserId?: string;
  startedAt: string;
  endedAt?: string;
}

export interface RoundState {
  roundNumber: number;
  drawerId: string;
  word: string | null;
  maskedWord: string;
  difficulty: Difficulty | null;
  timeRemaining: number;
  totalTime: number;
  hintsRevealed: number;
  guessersRemaining: number;
  firstGuessTime: number | null;
  correctGuessers: string[];
  phase: 'word_selection' | 'drawing' | 'round_end';
}

export interface GameState {
  id: string;
  lobbyId: string;
  gameMode: GameMode;
  totalRounds: number;
  currentRound: number;
  status: GameStatus;
  players: GamePlayer[];
  turnOrder: string[];
  currentDrawerId: string | null;
  roundState: RoundState | null;
}

export interface GamePlayer {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  countryCode?: string;
  points: number;
  correctGuesses: number;
  firstGuesses: number;
  isDrawing: boolean;
  hasGuessedCorrectly: boolean;
  isConnected: boolean;
}

export interface GameResults {
  gameId: string;
  players: GamePlayerResult[];
  totalRounds: number;
  gameMode: GameMode;
  duration: number;
}

export interface GamePlayerResult {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  countryCode?: string;
  rank: number;
  totalPoints: number;
  correctGuesses: number;
  firstGuesses: number;
  roundsDrawn: number;
  pointsGained: number;
}

export interface GuessResult {
  correct: boolean;
  points: number;
  isFirst: boolean;
  guessOrder: number;
  timeRemaining: number;
}
