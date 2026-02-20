import { Client, Databases, Users, Storage, Account, Query } from 'node-appwrite';

const client = new Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

export const databases = new Databases(client);
export const users = new Users(client);
export const storage = new Storage(client);

export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'artfully';

export const COLLECTIONS = {
  PROFILES: 'profiles_v2',
  USER_STATISTICS: 'user_statistics',
  WORDS: 'words',
  LOBBIES: 'lobbies',
  GAMES: 'games',
  GAME_PARTICIPANTS: 'game_participants',
  GAME_ROUNDS: 'game_rounds',
  SAVED_DRAWINGS: 'saved_drawings',
  ANNOUNCEMENTS: 'announcements',
  FEEDBACK: 'feedback',
  WALL_MESSAGES: 'wall_messages',
  NOTIFICATIONS: 'notifications',
} as const;

export const BUCKETS = {
  AVATARS: 'avatars',
} as const;

export { Query };
export default client;
