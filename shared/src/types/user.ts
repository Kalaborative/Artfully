export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarFileId?: string;
  avatarUrl?: string;
  countryCode?: string;
  biography?: string;
  isOnline: boolean;
  lastSeenAt?: string;
  createdAt: string;
}

export interface UserStatistics {
  id: string;
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  worldRank?: number;
  countryRank?: number;
}

export interface UserWithStats extends UserProfile {
  statistics: UserStatistics;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  countryCode?: string;
  totalPoints: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
}

export interface UpdateProfileData {
  displayName?: string;
  countryCode?: string;
  biography?: string;
  avatarFileId?: string;
  avatarUrl?: string;
}

export interface SavedDrawing {
  id: string;
  userId: string;
  imageFileId: string;
  imageUrl: string;
  createdAt: string;
}

export const MAX_SAVED_DRAWINGS = 3;

export interface WallMessage {
  id: string;
  profileUserId: string;
  authorUserId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
  content: string;
  parentId?: string;
  replies?: WallMessage[];
  createdAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'wall_message' | 'wall_reply';
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  referenceId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
