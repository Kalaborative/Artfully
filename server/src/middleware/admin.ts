import { Response, NextFunction } from 'express';
import { getEnv } from '../lib/env.js';
import { authMiddleware, AuthRequest } from './auth.js';

export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // First, authenticate the user via JWT
  await authMiddleware(req, res, () => {
    // After auth succeeds, check if user is an admin
    const adminIds = getEnv()
      .ADMIN_USER_IDS.split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!req.userId || !adminIds.includes(req.userId)) {
      res.status(403).json({ error: 'Forbidden: admin access required' });
      return;
    }

    next();
  });
}
