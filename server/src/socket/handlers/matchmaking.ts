import type { AuthenticatedSocket } from '../index.js';
import type { MatchmakingManager } from '../../matchmaking/MatchmakingManager.js';
import type { MatchmakingJoinPayload } from '@artfully/shared';

export function setupMatchmakingHandlers(
  socket: AuthenticatedSocket,
  matchmakingManager: MatchmakingManager
): void {
  socket.on('matchmaking:join', async (payload: MatchmakingJoinPayload, callback) => {
    console.log(`[Matchmaking] matchmaking:join received from ${socket.userId}, profile: ${!!socket.profile}, gameMode: ${payload.gameMode}`);

    if (!socket.userId || !socket.profile) {
      callback({ success: false, error: 'Not authenticated' });
      return;
    }

    try {
      await matchmakingManager.joinQueue(socket, payload.gameMode);
      callback({ success: true });
    } catch (error) {
      console.error('Error joining matchmaking:', error);
      callback({ success: false, error: 'Failed to join matchmaking queue' });
    }
  });

  socket.on('matchmaking:leave', () => {
    if (!socket.userId) return;
    matchmakingManager.leaveQueue(socket);
  });
}
