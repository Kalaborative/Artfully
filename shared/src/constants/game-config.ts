import type { GameMode, Difficulty } from '../types/game';

// Game Mode Configurations
export const GAME_MODE_CONFIG: Record<GameMode, {
  rounds: number;
  maxPoints: number;
  drawingTime: number;
  wordSelectionTime: number;
}> = {
  normal: {
    rounds: 3,
    maxPoints: 500,
    drawingTime: 90,
    wordSelectionTime: 15,
  },
  quick: {
    rounds: 2,
    maxPoints: 300,
    drawingTime: 60,
    wordSelectionTime: 10,
  },
};

// Difficulty Multipliers for Scoring
export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  easy: 0.6,
  medium: 0.8,
  hard: 1.0,
};

// Lobby Configuration
export const LOBBY_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 8,
  DEFAULT_MAX_PLAYERS: 8,
  WAIT_TIMER_SECONDS: 30,
  CODE_LENGTH: 8,
  GAME_START_COUNTDOWN: 5,
};

// Timer Configuration
export const TIMER_CONFIG = {
  HINT_REVEAL_TIMES: [60, 40, 20] as const, // Seconds remaining when hints reveal
  TIMER_HALVE_ON_FIRST_GUESS: true,
  MIN_TIME_AFTER_HALVE: 15, // Minimum seconds after timer halves
};

// Canvas Configuration
export const CANVAS_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  MAX_STROKE_POINTS: 10000,
  STROKE_THROTTLE_MS: 16, // ~60fps
  MIN_BRUSH_SIZE: 1,
  MAX_BRUSH_SIZE: 50,
};

// Chat Configuration
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 200,
  MESSAGES_TO_KEEP: 100,
  GUESS_SIMILARITY_THRESHOLD: 0.85, // For close guess detection
};

// Points Configuration
export const POINTS_CONFIG = {
  DRAWER_POINTS_RATIO: 0.5, // Drawer gets 50% of base points
  MIN_GUESSER_POINTS: 1,
};

// Word Categories
export const WORD_CATEGORIES = [
  'animals',
  'food',
  'objects',
  'actions',
  'places',
  'nature',
  'sports',
  'entertainment',
  'vehicles',
  'clothing',
] as const;

export type WordCategory = typeof WORD_CATEGORIES[number];

// Validation Limits
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  DISPLAY_NAME_MAX_LENGTH: 50,
  BIOGRAPHY_MAX_LENGTH: 500,
  PASSWORD_MIN_LENGTH: 8,
};
