import { Router, Response } from 'express';
import { adminMiddleware } from '../middleware/admin.js';
import { AuthRequest } from '../middleware/auth.js';
import {
  getAllWords,
  getActiveWords,
  getCategories,
  addWord,
  updateWord,
  deleteWord,
} from '../data/wordStore.js';
import type { Difficulty } from '@artfully/shared';

const router = Router();

// Get random words for word selection (internal use)
router.get('/random', async (req, res) => {
  try {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    const active = getActiveWords();
    const words = difficulties
      .map(d => {
        const pool = active.filter(w => w.difficulty === d);
        return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
      })
      .filter(Boolean);

    res.json(words);
  } catch (error) {
    console.error('Error fetching random words:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// Get word categories
router.get('/categories', async (_req, res) => {
  try {
    res.json(getCategories());
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ── Admin CRUD ──────────────────────────────────────────────

// List all words (paginated, searchable, filterable)
router.get('/admin/list', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const search = (req.query.search as string || '').trim().toLowerCase();
    const category = (req.query.category as string || '').trim();
    const difficulty = (req.query.difficulty as string || '').trim();

    let words = getAllWords();
    if (search) words = words.filter(w => w.word.includes(search));
    if (category) words = words.filter(w => w.category === category);
    if (difficulty) words = words.filter(w => w.difficulty === difficulty);

    const total = words.length;
    const offset = (page - 1) * limit;
    const paged = words.slice(offset, offset + limit);

    // Map to match the shape the client expects ($id field)
    res.json({
      words: paged.map(w => ({ $id: w.id, ...w })),
      total,
    });
  } catch (error) {
    console.error('Error listing words:', error);
    res.status(500).json({ error: 'Failed to list words' });
  }
});

// Add a new word
router.post('/admin', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { word, difficulty, category } = req.body;
    if (!word || !difficulty || !category) {
      return res.status(400).json({ error: 'word, difficulty, and category are required' });
    }

    const entry = addWord(word.trim().toLowerCase(), difficulty, category.trim());
    res.json({ $id: entry.id, ...entry });
  } catch (error) {
    console.error('Error adding word:', error);
    res.status(500).json({ error: 'Failed to add word' });
  }
});

// Edit a word
router.patch('/admin/:id', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const allowed = ['word', 'difficulty', 'category', 'isActive'] as const;
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.word) data.word = data.word.trim().toLowerCase();
    if (data.category) data.category = data.category.trim();

    const updated = updateWord(id, data);
    if (!updated) return res.status(404).json({ error: 'Word not found' });
    res.json({ $id: updated.id, ...updated });
  } catch (error) {
    console.error('Error updating word:', error);
    res.status(500).json({ error: 'Failed to update word' });
  }
});

// Delete a word
router.delete('/admin/:id', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ok = deleteWord(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Word not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting word:', error);
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

export default router;
