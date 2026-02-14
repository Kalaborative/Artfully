import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Client, Account } from 'node-appwrite';
import { getEnv } from '../lib/env.js';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  UserProfile
} from '@artfully/shared';
import { LobbyManager } from '../lobby/LobbyManager.js';
import { GameManager } from '../game/GameManager.js';
import { MatchmakingManager } from '../matchmaking/MatchmakingManager.js';
import { setupLobbyHandlers } from './handlers/lobby.js';
import { setupGameHandlers } from './handlers/game.js';
import { setupCanvasHandlers } from './handlers/canvas.js';
import { setupChatHandlers } from './handlers/chat.js';
import { setupMatchmakingHandlers } from './handlers/matchmaking.js';

export interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  userId?: string;
  username?: string;
  profile?: UserProfile;
}

let io: Server<ClientToServerEvents, ServerToClientEvents>;
let lobbyManager: LobbyManager;
let gameManager: GameManager;
let matchmakingManager: MatchmakingManager;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: getEnv().CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  lobbyManager = new LobbyManager(io);
  gameManager = new GameManager(io, lobbyManager);
  matchmakingManager = new MatchmakingManager(io, lobbyManager);

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle authentication
    socket.on('auth:token', async ({ token }) => {
      try {
        const client = new Client()
          .setEndpoint(getEnv().APPWRITE_ENDPOINT)
          .setProject(getEnv().APPWRITE_PROJECT_ID)
          .setJWT(token);

        const account = new Account(client);
        const user = await account.get();

        socket.userId = user.$id;

        // Get profile
        const profiles = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
          Query.equal('userId', user.$id)
        ]);

        if (profiles.documents.length > 0) {
          socket.profile = profiles.documents[0] as unknown as UserProfile;
          socket.username = socket.profile.username;
        }

        socket.emit('auth:success', {
          userId: user.$id,
          username: socket.username || user.email
        });

        console.log(`User authenticated: ${socket.username} (${socket.userId})`);
      } catch (error) {
        console.error('Authentication failed:', error);
        socket.emit('auth:failure', { message: 'Invalid token' });
      }
    });

    // Setup handlers
    setupLobbyHandlers(socket, lobbyManager, gameManager);
    setupGameHandlers(socket, gameManager);
    setupCanvasHandlers(socket, gameManager);
    setupChatHandlers(socket, gameManager);
    setupMatchmakingHandlers(socket, matchmakingManager);

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);

      if (socket.userId) {
        matchmakingManager.handleDisconnect(socket);
        lobbyManager.handleDisconnect(socket);
        gameManager.handleDisconnect(socket);
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export function getLobbyManager(): LobbyManager {
  return lobbyManager;
}

export function getGameManager(): GameManager {
  return gameManager;
}

export function getMatchmakingManager(): MatchmakingManager {
  return matchmakingManager;
}
