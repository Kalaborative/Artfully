import type { AuthenticatedSocket } from '../index.js';
import type { GameManager } from '../../game/GameManager.js';
import { CHAT_CONFIG } from '@artfully/shared';
import { v4 as uuidv4 } from 'uuid';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function setupChatHandlers(
  socket: AuthenticatedSocket,
  gameManager: GameManager
): void {
  socket.on('chat:message', (message: string) => {
    if (!socket.userId || !socket.username) return;

    const trimmedMessage = message.trim().slice(0, CHAT_CONFIG.MAX_MESSAGE_LENGTH);
    if (!trimmedMessage) return;

    const game = gameManager.getGameByPlayer(socket.userId);
    if (!game) return;

    // Broadcast to all players in the game room
    game.broadcastChatMessage({
      id: generateId(),
      userId: socket.userId,
      username: socket.username,
      message: trimmedMessage,
      timestamp: Date.now(),
      isSystem: false
    });
  });

  socket.on('chat:guess', (guess: string) => {
    if (!socket.userId || !socket.username) return;

    const trimmedGuess = guess.trim().slice(0, CHAT_CONFIG.MAX_MESSAGE_LENGTH);
    if (!trimmedGuess) return;

    const game = gameManager.getGameByPlayer(socket.userId);
    if (!game) return;

    // Drawer can't guess
    if (game.getCurrentDrawerId() === socket.userId) return;

    // Already guessed correctly
    if (game.hasPlayerGuessed(socket.userId)) {
      // Their messages go to other correct guessers only
      game.broadcastToCorrectGuessers({
        id: generateId(),
        userId: socket.userId,
        username: socket.username,
        message: trimmedGuess,
        timestamp: Date.now(),
        isSystem: false
      });
      return;
    }

    // Check if guess is correct
    const result = game.checkGuess(socket.userId, trimmedGuess);

    if (result.correct) {
      // Broadcast correct guess notification
      game.broadcastCorrectGuess({
        id: generateId(),
        userId: socket.userId,
        username: socket.username,
        points: result.points,
        isFirst: result.isFirst,
        timestamp: Date.now()
      });
    } else {
      // Broadcast guess attempt to non-guessers only (not to those who already guessed)
      game.broadcastGuessAttempt({
        id: generateId(),
        userId: socket.userId,
        username: socket.username,
        guess: trimmedGuess,
        timestamp: Date.now()
      });
    }
  });
}
