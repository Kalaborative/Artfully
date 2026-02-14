import { Router, Response } from 'express';
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS, Query } from '../lib/appwrite.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import type { UserProfile, UserStatistics, UpdateProfileData } from '@artfully/shared/types';
import { VALIDATION } from '@artfully/shared';
import { ID, InputFile } from 'node-appwrite';

const router = Router();

// Get current user's profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const profiles = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal('userId', userId)
    ]);

    if (profiles.documents.length === 0) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const profile = profiles.documents[0] as unknown as UserProfile;

    // Get statistics
    const stats = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STATISTICS, [
      Query.equal('userId', userId)
    ]);

    const statistics = stats.documents[0] as unknown as UserStatistics | undefined;

    res.json({
      ...profile,
      statistics: statistics || null
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update current user's profile
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const updates: UpdateProfileData = req.body;

    // Validate updates
    if (updates.displayName && updates.displayName.length > VALIDATION.DISPLAY_NAME_MAX_LENGTH) {
      res.status(400).json({ error: 'Display name too long' });
      return;
    }

    if (updates.biography && updates.biography.length > VALIDATION.BIOGRAPHY_MAX_LENGTH) {
      res.status(400).json({ error: 'Biography too long' });
      return;
    }

    if (updates.countryCode && updates.countryCode.length !== 2) {
      res.status(400).json({ error: 'Invalid country code' });
      return;
    }

    const profiles = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal('userId', userId)
    ]);

    if (profiles.documents.length === 0) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const profileId = profiles.documents[0].$id;

    const updatedProfile = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      profileId,
      updates
    );

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const profiles = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal('username', username)
    ]);

    if (profiles.documents.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const profile = profiles.documents[0] as unknown as UserProfile;

    // Get statistics
    const stats = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STATISTICS, [
      Query.equal('userId', profile.userId)
    ]);

    const statistics = stats.documents[0] as unknown as UserStatistics | undefined;

    res.json({
      ...profile,
      statistics: statistics || null
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
