import { Router, Response } from 'express';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import { adminMiddleware } from '../middleware/admin.js';
import { AuthRequest } from '../middleware/auth.js';
import { ID } from 'node-appwrite';

const router = Router();

// GET /api/announcements/latest — public, returns most recent active announcement
router.get('/latest', async (_req, res: Response) => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, [
      Query.equal('isActive', true),
      Query.orderDesc('createdAt'),
      Query.limit(1),
    ]);

    if (result.documents.length === 0) {
      res.json({ announcement: null });
      return;
    }

    const doc = result.documents[0] as any;
    res.json({
      announcement: {
        id: doc.$id,
        title: doc.title,
        content: doc.content,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching latest announcement:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// GET /api/announcements — admin-only, lists all announcements
router.get('/', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, [
      Query.orderDesc('createdAt'),
      Query.limit(50),
    ]);

    const announcements = result.documents.map((doc: any) => ({
      id: doc.$id,
      title: doc.title,
      content: doc.content,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      isActive: doc.isActive,
    }));

    res.json({ announcements });
  } catch (error) {
    console.error('Error listing announcements:', error);
    res.status(500).json({ error: 'Failed to list announcements' });
  }
});

// POST /api/announcements — admin-only, creates a new announcement
router.post('/', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    if (title.length > 255) {
      res.status(400).json({ error: 'Title must be 255 characters or less' });
      return;
    }

    if (content.length > 10000) {
      res.status(400).json({ error: 'Content must be 10000 characters or less' });
      return;
    }

    // Deactivate all currently active announcements
    const active = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, [
      Query.equal('isActive', true),
    ]);

    for (const doc of active.documents) {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, doc.$id, {
        isActive: false,
      });
    }

    // Create the new announcement
    const announcement = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ANNOUNCEMENTS,
      ID.unique(),
      {
        title,
        content,
        createdBy: req.userId!,
        createdAt: new Date().toISOString(),
        isActive: true,
      }
    ) as any;

    res.status(201).json({
      announcement: {
        id: announcement.$id,
        title: announcement.title,
        content: announcement.content,
        createdBy: announcement.createdBy,
        createdAt: announcement.createdAt,
        isActive: announcement.isActive,
      },
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

export default router;
