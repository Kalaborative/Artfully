import { Router, Response } from 'express';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { SHOP_ITEMS } from '@artfully/shared';
import { ID } from 'node-appwrite';

const router = Router();

// GET /purchases — Get user's purchased item IDs
router.get('/purchases', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_PURCHASES, [
      Query.equal('userId', userId),
      Query.limit(100),
    ]);

    const purchasedItems = result.documents.map((doc: any) => doc.itemId);
    res.json({ purchasedItems });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// POST /purchase — Purchase an item
router.post('/purchase', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { itemId } = req.body;

    // Validate item exists
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
      res.status(400).json({ error: 'Invalid item' });
      return;
    }

    // Check not already owned
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_PURCHASES, [
      Query.equal('userId', userId),
      Query.equal('itemId', itemId),
      Query.limit(1),
    ]);

    if (existing.documents.length > 0) {
      res.status(400).json({ error: 'Item already owned' });
      return;
    }

    // Verify sufficient coins
    const statsDocs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STATISTICS, [
      Query.equal('userId', userId),
      Query.limit(1),
    ]);

    if (statsDocs.documents.length === 0) {
      res.status(400).json({ error: 'No statistics found' });
      return;
    }

    const statsDoc = statsDocs.documents[0] as any;
    const currentCoins = statsDoc.coins || 0;

    if (currentCoins < item.price) {
      res.status(400).json({ error: 'Insufficient coins' });
      return;
    }

    // Deduct coins
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.USER_STATISTICS, statsDoc.$id, {
      coins: currentCoins - item.price,
    });

    // Create purchase
    await databases.createDocument(DATABASE_ID, COLLECTIONS.USER_PURCHASES, ID.unique(), {
      userId,
      itemId,
      purchasedAt: new Date().toISOString(),
    });

    res.json({ success: true, coins: currentCoins - item.price });
  } catch (error) {
    console.error('Error purchasing item:', error);
    res.status(500).json({ error: 'Failed to purchase item' });
  }
});

// GET /coins — Get user's coin balance
router.get('/coins', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STATISTICS, [
      Query.equal('userId', userId),
      Query.limit(1),
    ]);

    const coins = result.documents.length > 0 ? (result.documents[0] as any).coins || 0 : 0;
    res.json({ coins });
  } catch (error) {
    console.error('Error fetching coins:', error);
    res.status(500).json({ error: 'Failed to fetch coins' });
  }
});

// POST /admin/add-coins — Add coins to admin's own account
router.post('/admin/add-coins', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { amount } = req.body;

    const parsed = parseInt(amount, 10);
    if (!parsed || parsed <= 0 || parsed > 1000000) {
      res.status(400).json({ error: 'Amount must be between 1 and 1,000,000' });
      return;
    }

    const statsDocs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STATISTICS, [
      Query.equal('userId', userId),
      Query.limit(1),
    ]);

    if (statsDocs.documents.length === 0) {
      res.status(400).json({ error: 'No statistics found' });
      return;
    }

    const doc = statsDocs.documents[0] as any;
    const newCoins = (doc.coins || 0) + parsed;

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.USER_STATISTICS, doc.$id, {
      coins: newCoins,
    });

    res.json({ success: true, coins: newCoins });
  } catch (error) {
    console.error('Error adding coins:', error);
    res.status(500).json({ error: 'Failed to add coins' });
  }
});

export default router;
