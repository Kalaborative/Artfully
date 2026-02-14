import type { AuthenticatedSocket } from '../index.js';
import type { LobbyManager } from '../../lobby/LobbyManager.js';
import type { GameManager } from '../../game/GameManager.js';
import type { CreateLobbyOptions, JoinLobbyOptions, LobbyState } from '@artfully/shared';

export function setupLobbyHandlers(
  socket: AuthenticatedSocket,
  lobbyManager: LobbyManager,
  gameManager: GameManager
): void {
  socket.on('lobby:create', async (options: CreateLobbyOptions, callback) => {
    if (!socket.userId || !socket.profile) {
      callback({ success: false, error: 'Not authenticated' });
      return;
    }

    try {
      const lobby = await lobbyManager.createLobby(socket, options);
      callback({ success: true, lobby });
    } catch (error) {
      console.error('Error creating lobby:', error);
      callback({ success: false, error: 'Failed to create lobby' });
    }
  });

  socket.on('lobby:join', async (options: JoinLobbyOptions, callback) => {
    if (!socket.userId || !socket.profile) {
      callback({ success: false, error: 'Not authenticated' });
      return;
    }

    try {
      const lobby = await lobbyManager.joinLobby(socket, options.code);
      if (lobby) {
        callback({ success: true, lobby });
      } else {
        callback({ success: false, error: 'Lobby not found or full' });
      }
    } catch (error) {
      console.error('Error joining lobby:', error);
      callback({ success: false, error: 'Failed to join lobby' });
    }
  });

  socket.on('lobby:leave', () => {
    if (!socket.userId) return;
    lobbyManager.leaveLobby(socket);
  });

  socket.on('lobby:start', async () => {
    console.log('[Server] lobby:start received from', socket.userId);

    if (!socket.userId) {
      console.log('[Server] lobby:start rejected: no userId');
      return;
    }

    const lobby = lobbyManager.getLobbyByPlayer(socket.userId);
    if (!lobby) {
      console.log('[Server] lobby:start rejected: no lobby found for user', socket.userId);
      return;
    }

    console.log('[Server] lobby:start lobby found:', lobby.id, 'host:', lobby.hostId, 'players:', lobby.players.length, 'minPlayers:', lobby.minPlayers);

    // Only host can start
    if (lobby.hostId !== socket.userId) {
      console.log('[Server] lobby:start rejected: not host');
      socket.emit('lobby:error', { message: 'Only the host can start the game' });
      return;
    }

    // Check minimum players
    if (lobby.players.length < lobby.minPlayers) {
      console.log('[Server] lobby:start rejected: not enough players', lobby.players.length, '<', lobby.minPlayers);
      socket.emit('lobby:error', {
        message: `Need at least ${lobby.minPlayers} players to start`
      });
      return;
    }

    console.log('[Server] lobby:start calling gameManager.startGame');
    try {
      await gameManager.startGame(lobby);
      console.log('[Server] lobby:start gameManager.startGame completed');
    } catch (error) {
      console.error('[Server] Failed to start game:', error);
      socket.emit('lobby:error', { message: 'Failed to start game' });
    }
  });

  socket.on('lobby:ready', (ready: boolean) => {
    if (!socket.userId) return;
    lobbyManager.setPlayerReady(socket.userId, ready);
  });
}
