import type { GameMode, GameState, GameResults, WordChoice, Difficulty } from './game';
import type { LobbyState, LobbyPlayer, CreateLobbyOptions, JoinLobbyOptions } from './lobby';
import type { StrokeStartData, StrokeData, StrokeEndData, FillData, Stroke } from './canvas';

// Auth Events
export interface AuthTokenPayload {
  token: string;
}

export interface AuthSuccessPayload {
  userId: string;
  username: string;
}

export interface AuthFailurePayload {
  message: string;
}

// Lobby Events
export interface LobbyCreatedPayload {
  lobby: LobbyState;
}

export interface LobbyJoinedPayload {
  lobby: LobbyState;
}

export interface LobbyPlayerJoinedPayload {
  player: LobbyPlayer;
}

export interface LobbyPlayerLeftPayload {
  userId: string;
  newHostId?: string;
}

export interface LobbyTimerStartPayload {
  seconds: number;
}

export interface LobbyTimerUpdatePayload {
  seconds: number;
}

export interface LobbyErrorPayload {
  message: string;
  code?: string;
}

// Game Events
export interface GameStartingPayload {
  countdown: number;
}

export interface GameStartedPayload {
  game: GameState;
}

export interface GameEndedPayload {
  results: GameResults;
}

export interface RoundStartPayload {
  roundNumber: number;
  drawerId: string;
  totalTime: number;
}

export interface WordSelectionPayload {
  choices: WordChoice[];
  timeLimit: number;
}

export interface WordSelectedPayload {
  difficulty: Difficulty;
  wordLength: number;
  maskedWord: string;
}

export interface RoundTimerUpdatePayload {
  timeRemaining: number;
  timerHalved: boolean;
}

export interface HintRevealPayload {
  maskedWord: string;
  hintsRevealed: number;
}

export interface CorrectGuessPayload {
  userId: string;
  username: string;
  points: number;
  isFirst: boolean;
  guessOrder: number;
  guessersRemaining: number;
}

export interface RoundEndPayload {
  word: string;
  drawerPoints: number;
  guessers: Array<{
    userId: string;
    username: string;
    points: number;
    guessOrder: number;
  }>;
  scores: Array<{
    userId: string;
    totalPoints: number;
  }>;
}

export interface PlayerLeftGamePayload {
  userId: string;
  username: string;
}

// Canvas Events
export interface CanvasStrokeStartPayload extends StrokeStartData {
  userId: string;
}

export interface CanvasStrokeDataPayload extends StrokeData {
  userId: string;
}

export interface CanvasStrokeEndPayload extends StrokeEndData {
  userId: string;
}

export interface CanvasFillPayload extends FillData {
  userId: string;
}

export interface CanvasClearPayload {
  userId: string;
  timestamp: number;
}

export interface CanvasUndoPayload {
  userId: string;
  actionId: string;
  strokeId?: string;
}

export interface CanvasStatePayload {
  strokes: Stroke[];
}

// Chat Events
export interface ChatMessagePayload {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  isSystem: boolean;
}

export interface ChatGuessPayload {
  id: string;
  userId: string;
  username: string;
  guess: string;
  timestamp: number;
}

export interface ChatCorrectGuessPayload {
  id: string;
  userId: string;
  username: string;
  points: number;
  isFirst: boolean;
  timestamp: number;
}

// Matchmaking Events
export interface MatchmakingJoinPayload {
  gameMode: GameMode;
}

export interface MatchmakingMatchFoundPayload {
  lobby: LobbyState;
}

export interface MatchmakingQueueUpdatePayload {
  playersInQueue: number;
}

// Client to Server Events
export interface ClientToServerEvents {
  'auth:token': (payload: AuthTokenPayload) => void;

  'lobby:create': (payload: CreateLobbyOptions, callback: (response: { success: boolean; lobby?: LobbyState; error?: string }) => void) => void;
  'lobby:join': (payload: JoinLobbyOptions, callback: (response: { success: boolean; lobby?: LobbyState; error?: string }) => void) => void;
  'lobby:leave': () => void;
  'lobby:start': () => void;
  'lobby:ready': (ready: boolean) => void;
  'lobby:kick': (userId: string) => void;

  'matchmaking:join': (payload: MatchmakingJoinPayload, callback: (response: { success: boolean; error?: string }) => void) => void;
  'matchmaking:leave': () => void;

  'game:select_word': (wordIndex: number) => void;
  'game:leave': () => void;

  'canvas:stroke_start': (payload: StrokeStartData) => void;
  'canvas:stroke_data': (payload: StrokeData) => void;
  'canvas:stroke_end': (payload: StrokeEndData) => void;
  'canvas:fill': (payload: FillData) => void;
  'canvas:clear': () => void;
  'canvas:undo': () => void;

  'chat:message': (message: string) => void;
  'chat:guess': (guess: string) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  'auth:success': (payload: AuthSuccessPayload) => void;
  'auth:failure': (payload: AuthFailurePayload) => void;

  'lobby:created': (payload: LobbyCreatedPayload) => void;
  'lobby:joined': (payload: LobbyJoinedPayload) => void;
  'lobby:player_joined': (payload: LobbyPlayerJoinedPayload) => void;
  'lobby:player_left': (payload: LobbyPlayerLeftPayload) => void;
  'lobby:timer_start': (payload: LobbyTimerStartPayload) => void;
  'lobby:timer_update': (payload: LobbyTimerUpdatePayload) => void;
  'lobby:host_changed': (payload: { newHostId: string }) => void;
  'lobby:game_started': (payload: { gameId: string }) => void;
  'lobby:kicked': (payload: { reason?: string }) => void;
  'lobby:error': (payload: LobbyErrorPayload) => void;

  'matchmaking:match_found': (payload: MatchmakingMatchFoundPayload) => void;
  'matchmaking:queue_update': (payload: MatchmakingQueueUpdatePayload) => void;

  'game:starting': (payload: GameStartingPayload) => void;
  'game:started': (payload: GameStartedPayload) => void;
  'game:ended': (payload: GameEndedPayload) => void;
  'game:player_left': (payload: PlayerLeftGamePayload) => void;

  'round:start': (payload: RoundStartPayload) => void;
  'round:word_selection': (payload: WordSelectionPayload) => void;
  'round:word_selected': (payload: WordSelectedPayload) => void;
  'round:timer_update': (payload: RoundTimerUpdatePayload) => void;
  'round:hint_reveal': (payload: HintRevealPayload) => void;
  'round:correct_guess': (payload: CorrectGuessPayload) => void;
  'round:end': (payload: RoundEndPayload) => void;

  'canvas:stroke_start': (payload: CanvasStrokeStartPayload) => void;
  'canvas:stroke_data': (payload: CanvasStrokeDataPayload) => void;
  'canvas:stroke_end': (payload: CanvasStrokeEndPayload) => void;
  'canvas:fill': (payload: CanvasFillPayload) => void;
  'canvas:clear': (payload: CanvasClearPayload) => void;
  'canvas:undo': (payload: CanvasUndoPayload) => void;
  'canvas:state': (payload: CanvasStatePayload) => void;

  'chat:message': (payload: ChatMessagePayload) => void;
  'chat:guess': (payload: ChatGuessPayload) => void;
  'chat:correct_guess': (payload: ChatCorrectGuessPayload) => void;
}
