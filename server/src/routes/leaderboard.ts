import { Router } from 'express';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite.js';
import type { LeaderboardEntry, UserStatistics, UserProfile } from '@artfully/shared';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const country = req.query.country as string | undefined;

    if (country) {
      // Country leaderboard: find users with matching country, then get their stats
      const profileQueries = [
        Query.equal('countryCode', country),
        Query.limit(500)
      ];
      const profilesResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        profileQueries
      );

      if (profilesResult.documents.length === 0) {
        res.json({ entries: [], total: 0 });
        return;
      }

      const profilesMap = new Map<string, UserProfile>();
      const userIds: string[] = [];
      for (const doc of profilesResult.documents) {
        const profile = doc as unknown as UserProfile;
        profilesMap.set(profile.userId, profile);
        userIds.push(profile.userId);
      }

      // Fetch stats for these users sorted by points
      // Appwrite limits Query.equal arrays, so batch if needed
      const batchSize = 100;
      const allStats: any[] = [];
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const statsResult = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USER_STATISTICS,
          [Query.equal('userId', batch), Query.limit(batchSize)]
        );
        allStats.push(...statsResult.documents);
      }

      // Build entries and sort by points
      const entries: LeaderboardEntry[] = allStats.map(doc => {
        const stats = doc as unknown as UserStatistics;
        const profile = profilesMap.get(stats.userId);
        return {
          rank: 0,
          userId: stats.userId,
          username: profile?.username || 'Unknown',
          displayName: profile?.displayName || profile?.username || 'Unknown',
          avatarUrl: profile?.avatarUrl,
          activeFrame: profile?.activeFrame,
          activeNameEffect: profile?.activeNameEffect,
          countryCode: profile?.countryCode,
          totalPoints: stats.totalPoints,
          gamesPlayed: stats.gamesPlayed,
          gamesWon: stats.gamesWon,
          winRate: stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0
        };
      }).sort((a, b) => b.totalPoints - a.totalPoints);

      // Assign ranks and paginate
      entries.forEach((e, i) => { e.rank = i + 1; });
      const paginated = entries.slice(offset, offset + limit);

      res.json({ entries: paginated, total: entries.length });
    } else {
      // Global leaderboard
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

      const entries: LeaderboardEntry[] = statsResult.documents.map((doc, index) => {
        const stats = doc as unknown as UserStatistics;
        const profile = profilesMap.get(stats.userId);

        return {
          rank: offset + index + 1,
          userId: stats.userId,
          username: profile?.username || 'Unknown',
          displayName: profile?.displayName || profile?.username || 'Unknown',
          avatarUrl: profile?.avatarUrl,
          activeFrame: profile?.activeFrame,
          activeNameEffect: profile?.activeNameEffect,
          countryCode: profile?.countryCode,
          totalPoints: stats.totalPoints,
          gamesPlayed: stats.gamesPlayed,
          gamesWon: stats.gamesWon,
          winRate: stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0
        };
      });

      res.json({ entries, total: statsResult.total });
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
