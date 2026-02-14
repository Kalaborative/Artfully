import { Router } from 'express';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import type { LeaderboardEntry, UserStatistics, UserProfile } from '@artfully/shared';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const country = req.query.country as string | undefined;

    // Get statistics sorted by total points
    const queries = [
      Query.orderDesc('totalPoints'),
      Query.limit(limit),
      Query.offset(offset)
    ];

    const statsResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USER_STATISTICS,
      queries
    );

    if (statsResult.documents.length === 0) {
      res.json({ entries: [], total: 0 });
      return;
    }

    // Get profiles for these users
    const userIds = statsResult.documents.map(s => (s as unknown as UserStatistics).userId);

    const profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [Query.equal('userId', userIds)]
    );

    const profilesMap = new Map<string, UserProfile>();
    for (const doc of profilesResult.documents) {
      const profile = doc as unknown as UserProfile;
      profilesMap.set(profile.userId, profile);
    }

    // Build leaderboard entries
    const entries: LeaderboardEntry[] = statsResult.documents.map((doc, index) => {
      const stats = doc as unknown as UserStatistics;
      const profile = profilesMap.get(stats.userId);

      return {
        rank: offset + index + 1,
        userId: stats.userId,
        username: profile?.username || 'Unknown',
        displayName: profile?.displayName || profile?.username || 'Unknown',
        avatarUrl: profile?.avatarUrl,
        countryCode: profile?.countryCode,
        totalPoints: stats.totalPoints,
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon,
        winRate: stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0
      };
    });

    // Filter by country if specified
    const filteredEntries = country
      ? entries.filter(e => e.countryCode === country)
      : entries;

    res.json({
      entries: filteredEntries,
      total: statsResult.total
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
