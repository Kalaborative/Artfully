import { create } from 'zustand';
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';
import { connectSocket, disconnectSocket } from '../lib/socket';
import type { Models } from 'appwrite';
import type { UserProfile, UserStatistics } from '@artfully/shared';

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  profile: UserProfile | null;
  statistics: UserStatistics | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, countryCode: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshStatistics: () => Promise<void>;
  connectToSocket: () => Promise<void>;
}

function mapDocumentToProfile(doc: any): UserProfile {
  return {
    id: doc.$id,
    userId: doc.userId,
    username: doc.username,
    displayName: doc.displayName,
    avatarFileId: doc.avatarFileId,
    avatarUrl: doc.avatarUrl,
    countryCode: doc.countryCode,
    biography: doc.biography,
    isOnline: doc.isOnline,
    lastSeenAt: doc.lastSeenAt,
    createdAt: doc.createdAt,
  };
}

function mapDocumentToStatistics(doc: any): UserStatistics {
  return {
    id: doc.$id,
    userId: doc.userId,
    gamesPlayed: doc.gamesPlayed || 0,
    gamesWon: doc.gamesWon || 0,
    totalPoints: doc.totalPoints || 0,
    worldRank: doc.worldRank,
    countryRank: doc.countryRank,
  };
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const profiles = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal('userId', userId)
    ]);
    if (profiles.documents.length === 0) return null;
    return mapDocumentToProfile(profiles.documents[0]);
  } catch (error) {
    console.warn('Could not fetch profile (database may not be set up):', error);
    return null;
  }
}

async function fetchStatistics(userId: string): Promise<UserStatistics | null> {
  try {
    const stats = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STATISTICS, [
      Query.equal('userId', userId)
    ]);
    if (stats.documents.length === 0) return null;
    return mapDocumentToStatistics(stats.documents[0]);
  } catch (error) {
    console.warn('Could not fetch statistics:', error);
    return null;
  }
}

async function createProfile(userId: string, username: string, countryCode?: string): Promise<UserProfile | null> {
  try {
    const profile = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      ID.unique(),
      {
        userId,
        username,
        displayName: username,
        ...(countryCode ? { countryCode } : {}),
        isOnline: true,
        createdAt: new Date().toISOString()
      }
    );
    return mapDocumentToProfile(profile);
  } catch (error) {
    console.warn('Could not create profile:', error);
    return null;
  }
}

async function createStatistics(userId: string): Promise<UserStatistics | null> {
  try {
    const statistics = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USER_STATISTICS,
      ID.unique(),
      {
        userId,
        gamesPlayed: 0,
        gamesWon: 0,
        totalPoints: 0
      }
    );
    return mapDocumentToStatistics(statistics);
  } catch (error) {
    console.warn('Could not create statistics:', error);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  statistics: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      await account.createEmailPasswordSession(email, password);
      const user = await account.get();

      // Try to get profile and stats, but don't fail if they don't exist
      const profile = await fetchProfile(user.$id);
      const statistics = profile ? await fetchStatistics(user.$id) : null;

      set({
        user,
        profile,
        statistics,
        isAuthenticated: true,
        isLoading: false
      });

      // Try to connect to socket, but don't fail login if it doesn't work
      try {
        await get().connectToSocket();
      } catch (socketError) {
        console.warn('Socket connection failed:', socketError);
      }
    } catch (error: any) {
      set({
        user: null,
        profile: null,
        statistics: null,
        isAuthenticated: false,
        error: error.message || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },

  register: async (email: string, password: string, username: string, countryCode: string) => {
    try {
      set({ isLoading: true, error: null });

      // Create account
      const newUser = await account.create(ID.unique(), email, password, username);

      // Create session
      await account.createEmailPasswordSession(email, password);

      // Get full user object
      const user = await account.get();

      // Try to create profile and statistics
      const profile = await createProfile(newUser.$id, username, countryCode);
      const statistics = await createStatistics(newUser.$id);

      set({
        user,
        profile,
        statistics,
        isAuthenticated: true,
        isLoading: false
      });

      // Try to connect to socket
      try {
        await get().connectToSocket();
      } catch (socketError) {
        console.warn('Socket connection failed:', socketError);
      }
    } catch (error: any) {
      set({
        user: null,
        profile: null,
        statistics: null,
        isAuthenticated: false,
        error: error.message || 'Registration failed',
        isLoading: false
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      disconnectSocket();
      await account.deleteSession('current');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({
        user: null,
        profile: null,
        statistics: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  checkSession: async () => {
    try {
      set({ isLoading: true });

      const user = await account.get();

      // User has a valid session
      const profile = await fetchProfile(user.$id);
      const statistics = profile ? await fetchStatistics(user.$id) : null;

      set({
        user,
        profile,
        statistics,
        isAuthenticated: true,
        isLoading: false
      });

      // Try to connect to socket
      try {
        await get().connectToSocket();
      } catch (socketError) {
        console.warn('Socket connection failed:', socketError);
      }
    } catch {
      // No valid session
      set({
        user: null,
        profile: null,
        statistics: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const { profile } = get();
    if (!profile) return;

    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        profile.id,
        data
      );

      set({ profile: mapDocumentToProfile(updated) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    const profile = await fetchProfile(user.$id);
    const statistics = profile ? await fetchStatistics(user.$id) : null;

    set({ profile, statistics });
  },

  refreshStatistics: async () => {
    const { user } = get();
    if (!user) return;

    const statistics = await fetchStatistics(user.$id);
    set({ statistics });
  },

  connectToSocket: async () => {
    try {
      const jwt = await account.createJWT();
      await connectSocket(jwt.jwt);
    } catch (error) {
      console.error('Socket connection failed:', error);
      throw error;
    }
  }
}));
