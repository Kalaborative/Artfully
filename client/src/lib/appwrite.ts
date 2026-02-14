import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'artfully';

export const COLLECTIONS = {
  PROFILES: 'profiles_v2',
  USER_STATISTICS: 'user_statistics',
  WORDS: 'words',
  LOBBIES: 'lobbies',
  GAMES: 'games',
  GAME_PARTICIPANTS: 'game_participants',
  GAME_ROUNDS: 'game_rounds',
} as const;

export const BUCKETS = {
  AVATARS: '698e88f90001ce8fb61f',
} as const;

export { ID, Query };
export default client;
