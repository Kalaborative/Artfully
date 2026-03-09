import { Router, Response } from 'express';
import { adminMiddleware } from '../middleware/admin.js';
import { AuthRequest } from '../middleware/auth.js';
import { getChatLogs, getChatRooms, getTotalChatCount } from '../data/chatLogStore.js';
import { getIO, getLobbyManager, getGameManager, getMatchmakingManager } from '../socket/index.js';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';

const router = Router();

router.get('/stats', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const io = getIO();
    const connectedUsers = io.sockets.sockets.size;
    const activeLobbies = getLobbyManager().getActiveLobbyCount();
    const activeGames = getGameManager().getActiveGameCount();
    const mm = getMatchmakingManager();
    const matchmakingQueue = mm.getQueueSize('normal') + mm.getQueueSize('quick');
    const totalChatMessages = getTotalChatCount();
    const uptime = process.uptime();

    let totalRegisteredUsers = 0;
    try {
      const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STATISTICS, [
        Query.limit(1),
      ]);
      totalRegisteredUsers = result.total;
    } catch (e) {
      console.error('Failed to fetch registered user count:', e);
    }

    res.json({
      connectedUsers,
      activeLobbies,
      activeGames,
      matchmakingQueue,
      totalRegisteredUsers,
      totalChatMessages,
      uptime,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/list', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, username, message, type, page, limit } = req.query;
    const result = getChatLogs({
      roomId: roomId as string,
      username: username as string,
      message: message as string,
      type: type as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    res.status(500).json({ error: 'Failed to fetch chat logs' });
  }
});

router.get('/rooms', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    res.json(getChatRooms());
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

export default router;
