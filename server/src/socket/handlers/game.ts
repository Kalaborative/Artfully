import type { AuthenticatedSocket } from '../index.js';
import type { GameManager } from '../../game/GameManager.js';

export function setupGameHandlers(
  socket: AuthenticatedSocket,
  gameManager: GameManager
): void {
  socket.on('game:select_word', (wordIndex: number) => {
    if (!socket.userId) return;

    const game = gameManager.getGameByPlayer(socket.userId);
    if (!game) return;

    // Only drawer can select
    if (game.getCurrentDrawerId() !== socket.userId) return;

    game.selectWord(wordIndex);
  });

  socket.on('game:leave', () => {
    if (!socket.userId) return;
    gameManager.playerLeaveGame(socket.userId);
  });
}
