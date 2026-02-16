import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../socket/index.js';
import type {
  CreateLobbyOptions,
  LobbyState,
  LobbyPlayer,
  LobbyStatus,
  GameMode,
  ClientToServerEvents,
  ServerToClientEvents
} from '@artfully/shared';
import { LOBBY_CONFIG } from '@artfully/shared';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';

interface InternalLobby {
  id: string;
  code: string;
  hostId: string;
  gameMode: GameMode;
  maxPlayers: number;
  minPlayers: number;
  isPrivate: boolean;
  status: LobbyStatus;
  players: Map<string, LobbyPlayer>;
  timerInterval: NodeJS.Timeout | null;
  timerSeconds: number | null;
  createdAt: Date;
}

export class LobbyManager {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private lobbies: Map<string, InternalLobby> = new Map();
  private playerLobby: Map<string, string> = new Map(); // userId -> lobbyId
  private codeToLobby: Map<string, string> = new Map(); // code -> lobbyId
  onTimerExpired: ((lobby: LobbyState) => void) | null = null;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  private async getWorldRank(userId: string): Promise<number | undefined> {
    try {
      const stats = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STATISTICS, [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);
      if (stats.documents.length > 0 && stats.documents[0].worldRank) {
        return stats.documents[0].worldRank as number;
      }
    } catch (error) {
      console.error(`[LobbyManager] Failed to fetch worldRank for ${userId}:`, error);
    }
    return undefined;
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < LOBBY_CONFIG.CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async createLobby(socket: AuthenticatedSocket, options: CreateLobbyOptions): Promise<LobbyState> {
    if (!socket.userId || !socket.profile) {
      throw new Error('Not authenticated');
    }

    // Remove from any existing lobby
    this.leaveLobby(socket);

    let code = this.generateCode();
    while (this.codeToLobby.has(code)) {
      code = this.generateCode();
    }

    const lobbyId = this.generateId();

    const worldRank = await this.getWorldRank(socket.userId);

    const hostPlayer: LobbyPlayer = {
      userId: socket.userId,
      username: socket.profile.username,
      displayName: socket.profile.displayName || socket.profile.username,
      avatarUrl: socket.profile.avatarUrl,
      countryCode: socket.profile.countryCode,
      worldRank,
      isHost: true,
      isReady: true,
      joinedAt: new Date().toISOString()
    };

    const lobby: InternalLobby = {
      id: lobbyId,
      code,
      hostId: socket.userId,
      gameMode: options.gameMode,
      maxPlayers: options.maxPlayers || LOBBY_CONFIG.DEFAULT_MAX_PLAYERS,
      minPlayers: LOBBY_CONFIG.MIN_PLAYERS,
      isPrivate: options.isPrivate,
      status: 'waiting',
      players: new Map([[socket.userId, hostPlayer]]),
      timerInterval: null,
      timerSeconds: null,
      createdAt: new Date()
    };

    this.lobbies.set(lobbyId, lobby);
    this.playerLobby.set(socket.userId, lobbyId);
    this.codeToLobby.set(code, lobbyId);

    socket.join(`lobby:${lobbyId}`);

    return this.toLobbyState(lobby);
  }

  async joinLobby(socket: AuthenticatedSocket, code: string): Promise<LobbyState | null> {
    if (!socket.userId || !socket.profile) {
      throw new Error('Not authenticated');
    }

    const lobbyId = this.codeToLobby.get(code.toUpperCase());
    if (!lobbyId) return null;

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    if (lobby.status !== 'waiting') return null;
    if (lobby.players.size >= lobby.maxPlayers) return null;

    // Remove from any existing lobby
    this.leaveLobby(socket);

    const worldRank = await this.getWorldRank(socket.userId);

    const player: LobbyPlayer = {
      userId: socket.userId,
      username: socket.profile.username,
      displayName: socket.profile.displayName || socket.profile.username,
      avatarUrl: socket.profile.avatarUrl,
      countryCode: socket.profile.countryCode,
      worldRank,
      isHost: false,
      isReady: false,
      joinedAt: new Date().toISOString()
    };

    lobby.players.set(socket.userId, player);
    this.playerLobby.set(socket.userId, lobbyId);

    socket.join(`lobby:${lobbyId}`);

    // Notify others
    this.io.to(`lobby:${lobbyId}`).emit('lobby:player_joined', { player });

    // Start timer if we have enough players
    this.checkAutoStart(lobby);

    return this.toLobbyState(lobby);
  }

  leaveLobby(socket: AuthenticatedSocket): void {
    if (!socket.userId) return;

    const lobbyId = this.playerLobby.get(socket.userId);
    if (!lobbyId) return;

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    lobby.players.delete(socket.userId);
    this.playerLobby.delete(socket.userId);
    socket.leave(`lobby:${lobbyId}`);

    // Notify others
    this.io.to(`lobby:${lobbyId}`).emit('lobby:player_left', { userId: socket.userId });

    // If lobby is empty, delete it
    if (lobby.players.size === 0) {
      this.deleteLobby(lobby);
      return;
    }

    // If host left, assign new host
    if (lobby.hostId === socket.userId) {
      const newHost = lobby.players.values().next().value;
      if (newHost) {
        lobby.hostId = newHost.userId;
        newHost.isHost = true;
        this.io.to(`lobby:${lobbyId}`).emit('lobby:host_changed', { newHostId: newHost.userId });
      }
    }

    // Check if timer should stop
    if (lobby.players.size < lobby.minPlayers && lobby.timerInterval) {
      this.stopTimer(lobby);
    }
  }

  setPlayerReady(userId: string, ready: boolean): void {
    const lobbyId = this.playerLobby.get(userId);
    if (!lobbyId) return;

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    const player = lobby.players.get(userId);
    if (!player) return;

    player.isReady = ready;

    // Update all players
    this.io.to(`lobby:${lobbyId}`).emit('lobby:player_joined', { player });
  }

  private checkAutoStart(lobby: InternalLobby): void {
    if (lobby.players.size >= lobby.minPlayers && !lobby.timerInterval) {
      this.startTimer(lobby);
    }
  }

  private startTimer(lobby: InternalLobby): void {
    lobby.timerSeconds = LOBBY_CONFIG.WAIT_TIMER_SECONDS;

    this.io.to(`lobby:${lobby.id}`).emit('lobby:timer_start', {
      seconds: lobby.timerSeconds
    });

    lobby.timerInterval = setInterval(() => {
      if (lobby.timerSeconds === null) return;

      lobby.timerSeconds--;

      this.io.to(`lobby:${lobby.id}`).emit('lobby:timer_update', {
        seconds: lobby.timerSeconds
      });

      if (lobby.timerSeconds <= 0) {
        this.stopTimer(lobby);
        if (this.onTimerExpired) {
          this.onTimerExpired(this.toLobbyState(lobby));
        }
      }
    }, 1000);
  }

  private stopTimer(lobby: InternalLobby): void {
    if (lobby.timerInterval) {
      clearInterval(lobby.timerInterval);
      lobby.timerInterval = null;
      lobby.timerSeconds = null;
    }
  }

  private deleteLobby(lobby: InternalLobby): void {
    this.stopTimer(lobby);
    this.codeToLobby.delete(lobby.code);
    this.lobbies.delete(lobby.id);
  }

  findOpenLobby(gameMode: GameMode): InternalLobby | null {
    let best: InternalLobby | null = null;

    for (const lobby of this.lobbies.values()) {
      if (
        lobby.gameMode === gameMode &&
        lobby.status === 'waiting' &&
        !lobby.isPrivate &&
        lobby.players.size < lobby.maxPlayers
      ) {
        if (!best || lobby.players.size > best.players.size) {
          best = lobby;
        }
      }
    }

    return best;
  }

  getLobbyByPlayer(userId: string): LobbyState | null {
    const lobbyId = this.playerLobby.get(userId);
    if (!lobbyId) return null;

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    return this.toLobbyState(lobby);
  }

  getInternalLobby(lobbyId: string): InternalLobby | null {
    return this.lobbies.get(lobbyId) || null;
  }

  setLobbyStatus(lobbyId: string, status: LobbyStatus): void {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      lobby.status = status;
      this.stopTimer(lobby);
    }
  }

  closeLobby(lobbyId: string): void {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    // Remove all player-to-lobby mappings
    for (const userId of lobby.players.keys()) {
      this.playerLobby.delete(userId);
    }

    this.deleteLobby(lobby);
    console.log(`[LobbyManager] Closed lobby ${lobby.code} (${lobbyId})`);
  }

  kickPlayer(hostSocket: AuthenticatedSocket, targetUserId: string): { kicked: boolean; username?: string; error?: string } {
    if (!hostSocket.userId) return { kicked: false, error: 'Not authenticated' };

    const lobbyId = this.playerLobby.get(hostSocket.userId);
    if (!lobbyId) return { kicked: false, error: 'Not in a lobby' };

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { kicked: false, error: 'Lobby not found' };

    if (lobby.hostId !== hostSocket.userId) return { kicked: false, error: 'Only the host can kick players' };
    if (targetUserId === hostSocket.userId) return { kicked: false, error: 'Cannot kick yourself' };

    const targetPlayer = lobby.players.get(targetUserId);
    if (!targetPlayer) return { kicked: false, error: 'Player not in lobby' };

    const username = targetPlayer.username;

    // Remove target from lobby
    lobby.players.delete(targetUserId);
    this.playerLobby.delete(targetUserId);

    // Find target's socket and leave the room
    const targetSocket = this.getPlayerSocket(targetUserId);
    if (targetSocket) {
      targetSocket.leave(`lobby:${lobbyId}`);
      targetSocket.emit('lobby:kicked', { reason: 'You were kicked by the host' });
    }

    // Notify remaining players
    this.io.to(`lobby:${lobbyId}`).emit('lobby:player_left', { userId: targetUserId });

    // Check if timer should stop
    if (lobby.players.size < lobby.minPlayers && lobby.timerInterval) {
      this.stopTimer(lobby);
    }

    return { kicked: true, username };
  }

  private getPlayerSocket(userId: string): any {
    const sockets = this.io.sockets.sockets;
    for (const [, socket] of sockets) {
      if ((socket as any).userId === userId) {
        return socket;
      }
    }
    return null;
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    this.leaveLobby(socket);
  }

  private toLobbyState(lobby: InternalLobby): LobbyState {
    return {
      id: lobby.id,
      code: lobby.code,
      hostId: lobby.hostId,
      gameMode: lobby.gameMode,
      maxPlayers: lobby.maxPlayers,
      minPlayers: lobby.minPlayers,
      isPrivate: lobby.isPrivate,
      status: lobby.status,
      players: Array.from(lobby.players.values()),
      timerSeconds: lobby.timerSeconds,
      canStart: lobby.players.size >= lobby.minPlayers
    };
  }
}
