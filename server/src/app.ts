import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getEnv } from './lib/env.js';
import userRoutes from './routes/users.js';
import leaderboardRoutes from './routes/leaderboard.js';
import wordRoutes from './routes/words.js';
import drawingRoutes from './routes/drawings.js';
import announcementRoutes from './routes/announcements.js';
import feedbackRoutes from './routes/feedback.js';
import wallRoutes from './routes/wall.js';
import notificationRoutes from './routes/notifications.js';

const app = express();

// Middleware
app.use(express.json());
const origins = getEnv().CLIENT_URL.split(',').map(s => s.trim());
app.use(cors({
  origin: origins,
  credentials: true,
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/drawings', drawingRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/wall', wallRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
