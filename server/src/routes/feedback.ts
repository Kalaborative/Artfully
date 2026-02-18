import { Router, Response } from 'express';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import { adminMiddleware } from '../middleware/admin.js';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';
import { ID } from 'node-appwrite';

const router = Router();

// POST /api/feedback — public (optional auth), submit feedback
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { type, message, email } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (message.length > 2000) {
      res.status(400).json({ error: 'Message must be 2000 characters or less' });
      return;
    }

    const validTypes = ['bug', 'feedback', 'suggestion'];
    if (!type || !validTypes.includes(type)) {
      res.status(400).json({ error: 'Type must be one of: bug, feedback, suggestion' });
      return;
    }

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.FEEDBACK,
      ID.unique(),
      {
        type,
        message: message.trim(),
        email: email && typeof email === 'string' ? email.trim() : null,
        userId: req.userId || null,
        createdAt: new Date().toISOString(),
        isRead: false,
      }
    );

    res.status(201).json({ id: doc.$id });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// GET /api/feedback — admin only, list feedback
router.get('/', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.FEEDBACK, [
      Query.orderDesc('createdAt'),
      Query.limit(50),
    ]);

    const feedback = result.documents.map((doc: any) => ({
      id: doc.$id,
      type: doc.type,
      message: doc.message,
      email: doc.email,
      userId: doc.userId,
      createdAt: doc.createdAt,
      isRead: doc.isRead,
    }));

    res.json({ feedback });
  } catch (error) {
    console.error('Error listing feedback:', error);
    res.status(500).json({ error: 'Failed to list feedback' });
  }
});

// PATCH /api/feedback/:id — admin only, toggle isRead
router.patch('/:id', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.FEEDBACK, id) as any;

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.FEEDBACK,
      id,
      { isRead: !doc.isRead }
    ) as any;

    res.json({ id: updated.$id, isRead: updated.isRead });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

export default router;
