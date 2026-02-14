import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../socket/index.js';
import type { LobbyManager } from '../lobby/LobbyManager.js';
import type {
  GameMode,
  ClientToServerEvents,
  ServerToClientEvents
} from '@artfully/shared';

interface QueuedPlayer {
  socket: AuthenticatedSocket;
  userId: string;
  joinedAt: number;
}

interface MatchmakingQueue {
  players: Map<string, QueuedPlayer>;
  gameMode: GameMode;
}

// Minimum players for matchmaking - set to 2 for testing
const MATCHMAKING_MIN_PLAYERS = 2;

export class MatchmakingManager {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private lobbyManager: LobbyManager;
  private queues: Map<GameMode, MatchmakingQueue> = new Map();

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    lobbyManager: LobbyManager
  ) {
    this.io = io;
    this.lobbyManager = lobbyManager;

    // Initialize queues for each game mode
    this.queues.set('normal', { players: new Map(), gameMode: 'normal' });
    this.queues.set('quick', { players: new Map(), gameMode: 'quick' });
  }

  async joinQueue(socket: AuthenticatedSocket, gameMode: GameMode): Promise<void> {
    if (!socket.userId || !socket.profile) {
      throw new Error('Not authenticated');
    }

    // Remove from any existing queue first
    this.leaveAllQueues(socket.userId);

    // Remove from any existing lobby
    this.lobbyManager.leaveLobby(socket);

    const queue = this.queues.get(gameMode);
    if (!queue) {
      throw new Error('Invalid game mode');
    }

    // Add player to queue
    const queuedPlayer: QueuedPlayer = {
      socket,
      userId: socket.userId,
      joinedAt: Date.now()
    };

    queue.players.set(socket.userId, queuedPlayer);
    console.log(`Player ${socket.userId} joined ${gameMode} queue. Queue size: ${queue.players.size}`);

    // Broadcast queue update to all players in this queue
    this.broadcastQueueUpdate(gameMode);

    // Check if we can create a match
    await this.tryCreateMatch(gameMode);
  }

  leaveQueue(socket: AuthenticatedSocket): void {
    if (!socket.userId) return;

    this.leaveAllQueues(socket.userId);
  }

  private leaveAllQueues(userId: string): void {
    for (const [gameMode, queue] of this.queues) {
      if (queue.players.has(userId)) {
        queue.players.delete(userId);
        console.log(`Player ${userId} left ${gameMode} queue. Queue size: ${queue.players.size}`);
        this.broadcastQueueUpdate(gameMode);
      }
    }
  }

  private broadcastQueueUpdate(gameMode: GameMode): void {
    const queue = this.queues.get(gameMode);
    if (!queue) return;

    console.log(`[Matchmaking] Broadcasting queue update for ${gameMode}: ${queue.players.size} players`);

    // Emit queue update to all players in the queue
    for (const [, player] of queue.players) {
      console.log(`[Matchmaking] Sending queue_update to ${player.userId}: ${queue.players.size} players`);
      player.socket.emit('matchmaking:queue_update', {
        playersInQueue: queue.players.size
      });
    }
  }

  private async tryCreateMatch(gameMode: GameMode): Promise<void> {
    const queue = this.queues.get(gameMode);
    if (!queue) return;

    // Check if we have enough players
    if (queue.players.size < MATCHMAKING_MIN_PLAYERS) {
      return;
    }

    // Get players sorted by join time (FIFO)
    const sortedPlayers = Array.from(queue.players.values())
      .sort((a, b) => a.joinedAt - b.joinedAt);

    // Take the first MATCHMAKING_MIN_PLAYERS players
    const matchedPlayers = sortedPlayers.slice(0, MATCHMAKING_MIN_PLAYERS);
    const hostPlayer = matchedPlayers[0];

    try {
      // Create a lobby with the first player as host
      const lobby = await this.lobbyManager.createLobby(hostPlayer.socket, {
        gameMode,
        isPrivate: false
      });

      console.log(`Created match lobby ${lobby.code} for ${gameMode} mode`);

      // Remove all matched players from queue
      for (const player of matchedPlayers) {
        queue.players.delete(player.userId);
      }

      // Join other players to the lobby before notifying anyone
      for (let i = 1; i < matchedPlayers.length; i++) {
        const player = matchedPlayers[i];
        await this.lobbyManager.joinLobby(player.socket, lobby.code);
      }

      // Get the final lobby state with all players
      const finalLobby = this.lobbyManager.getLobbyByPlayer(hostPlayer.userId);
      if (!finalLobby) return;

      // Now notify all players with the complete lobby state
      for (const player of matchedPlayers) {
        player.socket.emit('matchmaking:match_found', { lobby: finalLobby });
      }

      // Broadcast queue update for remaining players
      this.broadcastQueueUpdate(gameMode);

      // Check if there are still enough players for another match
      await this.tryCreateMatch(gameMode);
    } catch (error) {
      console.error('Failed to create match:', error);
      // Re-add players to queue on failure
      for (const player of matchedPlayers) {
        if (!queue.players.has(player.userId)) {
          queue.players.set(player.userId, player);
        }
      }
    }
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    if (!socket.userId) return;
    this.leaveAllQueues(socket.userId);
  }

  // Get queue size for a specific game mode
  getQueueSize(gameMode: GameMode): number {
    const queue = this.queues.get(gameMode);
    return queue ? queue.players.size : 0;
  }
}
