// Authentication Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Auth
  AUTH_TOKEN: 'auth:token',
  AUTH_SUCCESS: 'auth:success',
  AUTH_FAILURE: 'auth:failure',

  // Lobby
  LOBBY_CREATE: 'lobby:create',
  LOBBY_JOIN: 'lobby:join',
  LOBBY_LEAVE: 'lobby:leave',
  LOBBY_START: 'lobby:start',
  LOBBY_READY: 'lobby:ready',
  LOBBY_CREATED: 'lobby:created',
  LOBBY_JOINED: 'lobby:joined',
  LOBBY_PLAYER_JOINED: 'lobby:player_joined',
  LOBBY_PLAYER_LEFT: 'lobby:player_left',
  LOBBY_TIMER_START: 'lobby:timer_start',
  LOBBY_TIMER_UPDATE: 'lobby:timer_update',
  LOBBY_HOST_CHANGED: 'lobby:host_changed',
  LOBBY_KICK: 'lobby:kick',
  LOBBY_KICKED: 'lobby:kicked',
  LOBBY_ERROR: 'lobby:error',

  // Game
  GAME_STARTING: 'game:starting',
  GAME_STARTED: 'game:started',
  GAME_ENDED: 'game:ended',
  GAME_SELECT_WORD: 'game:select_word',
  GAME_LEAVE: 'game:leave',
  GAME_PLAYER_LEFT: 'game:player_left',

  // Round
  ROUND_START: 'round:start',
  ROUND_WORD_SELECTION: 'round:word_selection',
  ROUND_WORD_SELECTED: 'round:word_selected',
  ROUND_TIMER_UPDATE: 'round:timer_update',
  ROUND_HINT_REVEAL: 'round:hint_reveal',
  ROUND_CORRECT_GUESS: 'round:correct_guess',
  ROUND_END: 'round:end',

  // Canvas
  CANVAS_STROKE_START: 'canvas:stroke_start',
  CANVAS_STROKE_DATA: 'canvas:stroke_data',
  CANVAS_STROKE_END: 'canvas:stroke_end',
  CANVAS_FILL: 'canvas:fill',
  CANVAS_CLEAR: 'canvas:clear',
  CANVAS_UNDO: 'canvas:undo',
  CANVAS_STATE: 'canvas:state',

  // Chat
  CHAT_MESSAGE: 'chat:message',
  CHAT_GUESS: 'chat:guess',
  CHAT_CORRECT_GUESS: 'chat:correct_guess',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
