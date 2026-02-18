import type { AuthenticatedSocket } from '../index.js';
import type { GameManager } from '../../game/GameManager.js';
import type { StrokeStartData, StrokeData, StrokeEndData, FillData } from '@artfully/shared';

export function setupCanvasHandlers(
  socket: AuthenticatedSocket,
  gameManager: GameManager
): void {
  socket.on('canvas:stroke_start', (data: StrokeStartData) => {
    console.log('[Canvas] stroke_start received from', socket.userId);
    if (!socket.userId) {
      console.log('[Canvas] stroke_start rejected: no userId');
      return;
    }

    const game = gameManager.getGameByPlayer(socket.userId);
    if (!game) {
      console.log('[Canvas] stroke_start rejected: no game found for user', socket.userId);
      return;
    }

    const drawerId = game.getCurrentDrawerId();
    if (drawerId !== socket.userId) {
      console.log('[Canvas] stroke_start rejected: not drawer. drawerId:', drawerId, 'userId:', socket.userId);
      return;
    }

    console.log('[Canvas] stroke_start broadcasting');
    game.broadcastCanvasEvent('canvas:stroke_start', {
      ...data,
      userId: socket.userId
    }, socket.userId);
  });

  socket.on('canvas:stroke_data', (data: StrokeData) => {
    if (!socket.userId) return;

    const game = gameManager.getGameByPlayer(socket.userId);
    if (!game) return;

    if (game.getCurrentDrawerId() !== socket.userId) return;

    game.broadcastCanvasEvent('canvas:stroke_data', {
      ...data,
      userId: socket.userId
    }, socket.userId);
  });

  socket.on('canvas:stroke_end', (data: StrokeEndData) => {
    if (!socket.userId) return;

    const game = gameManager.getGameByPlayer(socket.userId);
    if (!game) return;

    if (game.getCurrentDrawerId() !== socket.userId) return;

    game.addStroke(data.strokeId);
    game.broadcastCanvasEvent('canvas:stroke_end', {
      ...data,
      userId: socket.userId
    }, socket.userId);
  });

  socket.on('canvas:fill', (data: FillData) => {
    if (!socket.userId) return;

    const game = gameManager.getGameByPlayer(socket.userId);
    if (!game) return;

    if (game.getCurrentDrawerId() !== socket.userId) return;

    if (data.fillId) {
      game.addAction(data.fillId);
    }

    game.broadcastCanvasEvent('canvas:fill', {
      ...data,
      userId: socket.userId
    }, socket.userId);
  });

  socket.on('canvas:clear', () => {
    if (!socket.userId) return;

    const game = gameManager.getGameByPlayer(socket.userId);
    if (!game) return;

    if (game.getCurrentDrawerId() !== socket.userId) return;

    game.clearCanvas();
    game.broadcastCanvasEvent('canvas:clear', {
      userId: socket.userId,
      timestamp: Date.now()
    }, socket.userId);
  });

  socket.on('canvas:undo', () => {
    if (!socket.userId) return;

    const game = gameManager.getGameByPlayer(socket.userId);
    if (!game) return;

    if (game.getCurrentDrawerId() !== socket.userId) return;

    const actionId = game.undoAction();
    if (actionId) {
      game.broadcastCanvasEvent('canvas:undo', {
        userId: socket.userId,
        actionId,
        strokeId: actionId
      }, socket.userId);
    }
  });
}
