import { Router, Response } from 'express';
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS, Query } from '../lib/appwrite.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { MAX_SAVED_DRAWINGS } from '@artfully/shared';
import { ID } from 'node-appwrite';

const router = Router();

function mapDoc(doc: any) {
  return {
    id: doc.$id,
    userId: doc.userId,
    imageFileId: doc.imageFileId,
    imageUrl: doc.imageUrl,
    createdAt: doc.createdAt,
  };
}

// Get current user's saved drawings
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const drawings = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SAVED_DRAWINGS, [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
      Query.limit(MAX_SAVED_DRAWINGS),
    ]);

    res.json(drawings.documents.map(mapDoc));
  } catch (error) {
    console.error('Error fetching drawings:', error);
    res.status(500).json({ error: 'Failed to fetch drawings' });
  }
});

// Get drawings by username (public)
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const profiles = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal('username', username),
    ]);

    if (profiles.documents.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userId = (profiles.documents[0] as any).userId;

    const drawings = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SAVED_DRAWINGS, [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
      Query.limit(MAX_SAVED_DRAWINGS),
    ]);

    res.json(drawings.documents.map(mapDoc));
  } catch (error) {
    console.error('Error fetching user drawings:', error);
    res.status(500).json({ error: 'Failed to fetch drawings' });
  }
});

// Save a new drawing
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { imageFileId, imageUrl } = req.body;

    if (!imageFileId || typeof imageFileId !== 'string') {
      res.status(400).json({ error: 'imageFileId is required' });
      return;
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({ error: 'imageUrl is required' });
      return;
    }

    // Check current count
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SAVED_DRAWINGS, [
      Query.equal('userId', userId),
      Query.limit(MAX_SAVED_DRAWINGS + 1),
    ]);

    if (existing.documents.length >= MAX_SAVED_DRAWINGS) {
      res.status(400).json({
        error: `Maximum of ${MAX_SAVED_DRAWINGS} drawings allowed. Delete one to save a new one.`,
      });
      return;
    }

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SAVED_DRAWINGS,
      ID.unique(),
      {
        userId,
        imageFileId,
        imageUrl,
        createdAt: new Date().toISOString(),
      }
    );

    res.status(201).json(mapDoc(doc));
  } catch (error) {
    console.error('Error saving drawing:', error);
    res.status(500).json({ error: 'Failed to save drawing' });
  }
});

// Delete a drawing
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify ownership
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.SAVED_DRAWINGS, id);

    if ((doc as any).userId !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this drawing' });
      return;
    }

    // Delete storage file
    const fileId = (doc as any).imageFileId;
    if (fileId) {
      try {
        await storage.deleteFile(BUCKETS.AVATARS, fileId);
      } catch (err) {
        console.warn('Could not delete drawing file from storage:', err);
      }
    }

    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SAVED_DRAWINGS, id);

    res.json({ success: true });
  } catch (error: any) {
    if (error?.code === 404) {
      res.status(404).json({ error: 'Drawing not found' });
      return;
    }
    console.error('Error deleting drawing:', error);
    res.status(500).json({ error: 'Failed to delete drawing' });
  }
});

export default router;
