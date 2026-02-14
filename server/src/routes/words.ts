import { Router } from 'express';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import type { Word, Difficulty } from '@artfully/shared';

const router = Router();

// Get random words for word selection (internal use)
router.get('/random', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count as string) || 3, 10);

    // Get words from each difficulty
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    const words: Word[] = [];

    for (const difficulty of difficulties) {
      const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WORDS, [
        Query.equal('difficulty', difficulty),
        Query.equal('isActive', true),
        Query.limit(100)
      ]);

      if (result.documents.length > 0) {
        // Pick a random word from this difficulty
        const randomIndex = Math.floor(Math.random() * result.documents.length);
        words.push(result.documents[randomIndex] as unknown as Word);
      }
    }

    res.json(words);
  } catch (error) {
    console.error('Error fetching random words:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// Get word categories
router.get('/categories', async (_req, res) => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WORDS, [
      Query.select(['category']),
      Query.limit(1000)
    ]);

    const categories = [...new Set(result.documents.map(d => d.category as string))];
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
