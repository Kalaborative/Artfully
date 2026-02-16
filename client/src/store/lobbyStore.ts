import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import type { LobbyState, LobbyPlayer, CreateLobbyOptions, GameMode } from '@artfully/shared';

interface LobbyStoreState {
  lobby: LobbyState | null;
  isCreating: boolean;
  isJoining: boolean;
  isMatchmaking: boolean;
  playersInQueue: number;
  error: string | null;
  timerSeconds: number | null;
  wasKicked: boolean;

  createLobby: (options: CreateLobbyOptions) => Promise<LobbyState>;
  joinLobby: (code: string) => Promise<LobbyState>;
  joinMatchmaking: (gameMode: GameMode) => Promise<LobbyState | null>;
  leaveMatchmaking: () => void;
  leaveLobby: () => void;
  startGame: () => void;
  setReady: (ready: boolean) => void;
  kickPlayer: (userId: string) => void;
  setupListeners: () => () => void;
  reset: () => void;
}

export const useLobbyStore = create<LobbyStoreState>((set, get) => ({
  lobby: null,
  isCreating: false,
  isJoining: false,
  isMatchmaking: false,
  playersInQueue: 0,
  error: null,
  timerSeconds: null,
  wasKicked: false,

  createLobby: async (options: CreateLobbyOptions) => {
    set({ isCreating: true, error: null });

    return new Promise((resolve, reject) => {
      const socket = getSocket();

      socket.emit('lobby:create', options, (response) => {
        set({ isCreating: false });

        if (response.success && response.lobby) {
          set({ lobby: response.lobby });
          resolve(response.lobby);
        } else {
          set({ error: response.error || 'Failed to create lobby' });
          reject(new Error(response.error));
        }
      });
    });
  },

  joinLobby: async (code: string) => {
    set({ isJoining: true, error: null });

    return new Promise((resolve, reject) => {
      const socket = getSocket();

      socket.emit('lobby:join', { code }, (response) => {
        set({ isJoining: false });

        if (response.success && response.lobby) {
          set({ lobby: response.lobby });
          resolve(response.lobby);
        } else {
          set({ error: response.error || 'Failed to join lobby' });
          reject(new Error(response.error));
        }
      });
    });
  },

  joinMatchmaking: async (gameMode: GameMode) => {
    set({ isMatchmaking: true, error: null, playersInQueue: 0 });

    return new Promise((resolve, reject) => {
      const socket = getSocket();

      const cleanup = () => {
        socket.off('matchmaking:match_found', handleMatchFound);
        socket.off('matchmaking:queue_update', handleQueueUpdate);
      };

      // Listen for match found
      const handleMatchFound = (data: { lobby: LobbyState }) => {
        cleanup();
        set({ isMatchmaking: false, lobby: data.lobby, playersInQueue: 0 });
        resolve(data.lobby);
      };

      // Listen for queue updates
      const handleQueueUpdate = (data: { playersInQueue: number }) => {
        console.log('[Matchmaking] queue_update received:', data);
        set({ playersInQueue: data.playersInQueue });
      };

      // Register listeners BEFORE emitting join to avoid race condition
      socket.on('matchmaking:match_found', handleMatchFound);
      socket.on('matchmaking:queue_update', handleQueueUpdate);

      // Join the matchmaking queue
      console.log('[Matchmaking] Emitting matchmaking:join', gameMode);
      socket.emit('matchmaking:join', { gameMode }, (response: { success: boolean; error?: string }) => {
        console.log('[Matchmaking] join callback:', response);
        if (!response.success) {
          cleanup();
          set({ isMatchmaking: false, error: response.error || 'Failed to join queue', playersInQueue: 0 });
          reject(new Error(response.error));
        }
        // Stay in matchmaking state, wait for match_found event
      });
    });
  },

  leaveMatchmaking: () => {
    const socket = getSocket();
    socket.off('matchmaking:match_found');
    socket.off('matchmaking:queue_update');
    socket.emit('matchmaking:leave');
    set({ isMatchmaking: false, playersInQueue: 0 });
  },

  leaveLobby: () => {
    const socket = getSocket();
    socket.emit('lobby:leave');
    set({ lobby: null, timerSeconds: null });
  },

  startGame: () => {
    const socket = getSocket();
    console.log('[Client] Emitting lobby:start, socket connected:', socket.connected);
    socket.emit('lobby:start');
  },

  setReady: (ready: boolean) => {
    const socket = getSocket();
    socket.emit('lobby:ready', ready);
  },

  kickPlayer: (userId: string) => {
    const socket = getSocket();
    socket.emit('lobby:kick', userId);
  },

  setupListeners: () => {
    const socket = getSocket();

    const handlePlayerJoined = ({ player }: { player: LobbyPlayer }) => {
      const { lobby } = get();
      if (!lobby) return;

      const existingIndex = lobby.players.findIndex(p => p.userId === player.userId);
      const players = existingIndex >= 0
        ? lobby.players.map((p, i) => i === existingIndex ? player : p)
        : [...lobby.players, player];

      set({
        lobby: {
          ...lobby,
          players,
          canStart: players.length >= lobby.minPlayers
        }
      });
    };

    const handlePlayerLeft = ({ userId }: { userId: string }) => {
      const { lobby } = get();
      if (!lobby) return;

      const players = lobby.players.filter(p => p.userId !== userId);
      set({
        lobby: {
          ...lobby,
          players,
          canStart: players.length >= lobby.minPlayers
        }
      });
    };

    const handleHostChanged = ({ newHostId }: { newHostId: string }) => {
      const { lobby } = get();
      if (!lobby) return;

      set({
        lobby: {
          ...lobby,
          hostId: newHostId,
          players: lobby.players.map(p => ({
            ...p,
            isHost: p.userId === newHostId
          }))
        }
      });
    };

    const handleTimerStart = ({ seconds }: { seconds: number }) => {
      set({ timerSeconds: seconds });
    };

    const handleTimerUpdate = ({ seconds }: { seconds: number }) => {
      set({ timerSeconds: seconds });
    };

    const handleError = ({ message }: { message: string }) => {
      console.log('[Client] lobby:error received:', message);
      set({ error: message });
    };

    const handleGameStarted = ({ gameId }: { gameId: string }) => {
      console.log('[Client] lobby:game_started received, gameId:', gameId);
    };

    const handleKicked = () => {
      set({ lobby: null, timerSeconds: null, wasKicked: true });
    };

    socket.on('lobby:player_joined', handlePlayerJoined);
    socket.on('lobby:player_left', handlePlayerLeft);
    socket.on('lobby:host_changed', handleHostChanged);
    socket.on('lobby:timer_start', handleTimerStart);
    socket.on('lobby:timer_update', handleTimerUpdate);
    socket.on('lobby:error', handleError);
    socket.on('lobby:game_started', handleGameStarted);
    socket.on('lobby:kicked', handleKicked);

    return () => {
      socket.off('lobby:player_joined', handlePlayerJoined);
      socket.off('lobby:player_left', handlePlayerLeft);
      socket.off('lobby:host_changed', handleHostChanged);
      socket.off('lobby:timer_start', handleTimerStart);
      socket.off('lobby:timer_update', handleTimerUpdate);
      socket.off('lobby:error', handleError);
      socket.off('lobby:game_started', handleGameStarted);
      socket.off('lobby:kicked', handleKicked);
    };
  },

  reset: () => {
    set({
      lobby: null,
      isCreating: false,
      isJoining: false,
      isMatchmaking: false,
      playersInQueue: 0,
      error: null,
      timerSeconds: null,
      wasKicked: false
    });
  }
}));
