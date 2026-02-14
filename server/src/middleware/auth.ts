import { Request, Response, NextFunction } from 'express';
import { Client, Account } from 'node-appwrite';
import { getEnv } from '../lib/env.js';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const jwt = authHeader.substring(7);

    // Create a new client for this request with the JWT
    const client = new Client()
      .setEndpoint(getEnv().APPWRITE_ENDPOINT)
      .setProject(getEnv().APPWRITE_PROJECT_ID)
      .setJWT(jwt);

    const account = new Account(client);

    try {
      const user = await account.get();
      req.userId = user.$id;
      req.userEmail = user.email;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  authMiddleware(req, res, next);
}
