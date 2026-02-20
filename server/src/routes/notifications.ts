import { Router, Response } from 'express';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

function mapNotification(doc: any) {
  return {
    id: doc.$id,
    userId: doc.userId,
    type: doc.type,
    fromUserId: doc.fromUserId,
    fromUsername: doc.fromUsername,
    fromDisplayName: doc.fromDisplayName,
    referenceId: doc.referenceId,
    message: doc.message,
    isRead: doc.isRead,
    createdAt: doc.createdAt,
  };
}

// GET / — Get user's notifications (recent 50)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
      Query.limit(50),
    ]);

    res.json({ notifications: result.documents.map(mapNotification) });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /unread-count — Get count of unread notifications
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal('userId', userId),
      Query.equal('isRead', false),
      Query.limit(100),
    ]);

    res.json({ count: result.documents.length });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PATCH /read — Mark all as read
router.patch('/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const unread = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal('userId', userId),
      Query.equal('isRead', false),
      Query.limit(100),
    ]);

    for (const doc of unread.documents) {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, doc.$id, {
        isRead: true,
      });
    }

    res.json({ success: true, updated: unread.documents.length });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// PATCH /:id/read — Mark single notification as read
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, id) as any;
    if (doc.userId !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, id, {
      isRead: true,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
