import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../socket/index.js';
import type { LobbyState, ClientToServerEvents, ServerToClientEvents } from '@artfully/shared';
import { LobbyManager } from '../lobby/LobbyManager.js';
import { GameRoom } from './GameRoom.js';

export class GameManager {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private lobbyManager: LobbyManager;
  private games: Map<string, GameRoom> = new Map(); // lobbyId -> GameRoom
  private playerGame: Map<string, string> = new Map(); // oduserId -> lobbyId

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    lobbyManager: LobbyManager
  ) {
    this.io = io;
    this.lobbyManager = lobbyManager;

    this.lobbyManager.onTimerExpired = (lobby) => {
      this.startGame(lobby).catch(error => {
        console.error('Failed to start game from timer:', error);
      });
    };
  }

  async startGame(lobby: LobbyState): Promise<void> {
    console.log('[GameManager] startGame called, lobbyId:', lobby.id, 'players:', lobby.players.length);

    // Update lobby status
    this.lobbyManager.setLobbyStatus(lobby.id, 'in_game');

    // Notify lobby clients that the game is starting, before moving sockets
    console.log('[GameManager] Emitting lobby:game_started to lobby:', lobby.id);
    this.io.to(`lobby:${lobby.id}`).emit('lobby:game_started', { gameId: lobby.id });

    // Create game room
    const game = new GameRoom(
      this.io,
      lobby.id,
      lobby.gameMode,
      lobby.players,
      lobby.hostId
    );

    this.games.set(lobby.id, game);

    // Schedule lobby + game cleanup when the game ends
    game.onGameEnd = (lobbyId: string) => {
      console.log(`[GameManager] Game ended for lobby ${lobbyId}, scheduling cleanup`);
      setTimeout(() => {
        this.lobbyManager.setLobbyStatus(lobbyId, 'finished');
        this.lobbyManager.closeLobby(lobbyId);
        this.cleanupGame(lobbyId);
        console.log(`[GameManager] Cleanup complete for lobby ${lobbyId}`);
      }, 5000);
    };

    // Map players to game
    for (const player of lobby.players) {
      this.playerGame.set(player.userId, lobby.id);

      // Move player sockets from lobby room to game room
      const socket = this.getPlayerSocket(player.userId);
      if (socket) {
        console.log('[GameManager] Moving socket', socket.id, 'for user', player.userId, 'from lobby:', `lobby:${lobby.id}`, 'to game:', game.getRoomId());
        socket.leave(`lobby:${lobby.id}`);
        socket.join(game.getRoomId());
      } else {
        console.log('[GameManager] WARNING: No socket found for user', player.userId);
      }
    }

    // Start the game
    console.log('[GameManager] Calling game.start(), roomId:', game.getRoomId());
    await game.start();
    console.log('[GameManager] game.start() completed');
  }

  getGameByPlayer(userId: string): GameRoom | null {
    const lobbyId = this.playerGame.get(userId);
    if (!lobbyId) return null;
    return this.games.get(lobbyId) || null;
  }

  playerLeaveGame(userId: string): void {
    const game = this.getGameByPlayer(userId);
    if (!game) return;

    game.handlePlayerDisconnect(userId);
    this.playerGame.delete(userId);
  }

  kickPlayer(hostUserId: string, targetUserId: string): boolean {
    const game = this.getGameByPlayer(hostUserId);
    if (!game) return false;

    // Validate the caller is the host
    if (game.getHostId() !== hostUserId) return false;

    const result = game.kickPlayer(targetUserId);
    if (!result) return false;

    // Remove player-game mapping
    this.playerGame.delete(targetUserId);

    // Emit kicked event to target
    const targetSocket = this.getPlayerSocket(targetUserId);
    if (targetSocket) {
      targetSocket.emit('lobby:kicked', { reason: 'You were kicked by the host' });
    }

    return true;
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    if (socket.userId) {
      const game = this.getGameByPlayer(socket.userId);
      if (game) {
        game.handlePlayerDisconnect(socket.userId);
      }
    }
  }

  private getPlayerSocket(userId: string): AuthenticatedSocket | null {
    const sockets = this.io.sockets.sockets;
    for (const [, socket] of sockets) {
      if ((socket as AuthenticatedSocket).userId === userId) {
        return socket as AuthenticatedSocket;
      }
    }
    return null;
  }

  cleanupGame(lobbyId: string): void {
    const game = this.games.get(lobbyId);
    if (game) {
      this.games.delete(lobbyId);

      // Clean up player mappings
      for (const [userId, gameId] of this.playerGame) {
        if (gameId === lobbyId) {
          this.playerGame.delete(userId);
        }
      }
    }
  }
}
