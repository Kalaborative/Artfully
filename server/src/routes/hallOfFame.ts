import { Router, Response } from 'express';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ID } from 'node-appwrite';
import { getEnv } from '../lib/env.js';
import { HallOfFameEntry } from '@artfully/shared';

const router = Router();

// Helper to check admin status
const isAdmin = (userId: string) => {
    const adminIds = getEnv().ADMIN_USER_IDS.split(',').map(s => s.trim()).filter(Boolean);
    return adminIds.includes(userId);
};

// Get all Hall of Fame entries
router.get('/', async (_req, res: Response) => {
    try {
        const entries = await databases.listDocuments(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, [
            Query.orderDesc('createdAt'),
            Query.limit(50)
        ]);

        const mapped: HallOfFameEntry[] = entries.documents.map((d) => {
            const doc = d as any;
            return {
                id: doc.$id,
                originalDrawingId: doc.originalDrawingId,
                userId: doc.userId,
                artistName: doc.artistName,
                imageFileId: doc.imageFileId,
                imageUrl: doc.imageUrl,
                replayData: doc.replayData ?? undefined,
                likesCount: doc.likesCount || 0,
                createdAt: doc.createdAt
            };
        });

        res.json({ success: true, hallOfFame: mapped });
    } catch (err) {
        console.error('Error fetching Hall of Fame entries:', err);
        res.status(500).json({ error: 'Failed to fetch Hall of Fame' });
    }
});

// Add a drawing to the Hall of Fame (Admin Only)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.userId!;

        if (!isAdmin(adminId)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        const {
            originalDrawingId,
            userId,
            artistName,
            imageFileId,
            imageUrl,
            replayData
        } = req.body;

        if (!originalDrawingId || !userId || !artistName || !imageFileId || !imageUrl) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Check if it already exists avoiding duplicates
        const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, [
            Query.equal('originalDrawingId', originalDrawingId)
        ]);

        if (existing.documents.length > 0) {
            res.status(400).json({ error: 'Drawing is already in the Hall of Fame' });
            return;
        }

        const docData: Record<string, any> = {
            originalDrawingId,
            userId,
            artistName,
            imageFileId,
            imageUrl,
            likesCount: 0,
            createdAt: new Date().toISOString()
        };

        if (replayData) {
            docData.replayData = replayData;
        }

        const doc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.HALL_OF_FAME,
            ID.unique(),
            docData
        );

        const docAny = doc as any;
        const mapped: HallOfFameEntry = {
            id: docAny.$id,
            originalDrawingId: docAny.originalDrawingId,
            userId: docAny.userId,
            artistName: docAny.artistName,
            imageFileId: docAny.imageFileId,
            imageUrl: docAny.imageUrl,
            replayData: docAny.replayData ?? undefined,
            likesCount: docAny.likesCount || 0,
            createdAt: docAny.createdAt
        };

        res.json({ success: true, entry: mapped });
    } catch (err) {
        console.error('Error adding to Hall of Fame:', err);
        res.status(500).json({ error: 'Failed to add to Hall of Fame' });
    }
});

// Remove a drawing from the Hall of Fame (Admin Only)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.userId!;

        if (!isAdmin(adminId)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        const entryId = req.params.id;

        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.HALL_OF_FAME,
            entryId
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error removing from Hall of Fame:', err);
        res.status(500).json({ error: 'Failed to remove from Hall of Fame' });
    }
});

// Like a drawing (No Auth Required)
router.post('/:id/like', async (req, res: Response) => {
    try {
        const entryId = req.params.id;

        // Fetch current entry
        const entry = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.HALL_OF_FAME,
            entryId
        );

        const entryAny = entry as any;
        const currentLikes = entryAny.likesCount || 0;

        // Increment likes count
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.HALL_OF_FAME,
            entryId,
            {
                likesCount: currentLikes + 1
            }
        );

        res.json({ success: true, likesCount: currentLikes + 1 });
    } catch (err) {
        console.error('Error liking Hall of Fame entry:', err);
        res.status(500).json({ error: 'Failed to like entry' });
    }
});

export default router;
