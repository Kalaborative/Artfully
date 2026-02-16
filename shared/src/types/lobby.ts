import type { GameMode } from './game';

export type LobbyStatus = 'waiting' | 'starting' | 'in_game' | 'finished';

export interface Lobby {
  id: string;
  code: string;
  hostId: string;
  gameMode: GameMode;
  maxPlayers: number;
  minPlayers: number;
  isPrivate: boolean;
  status: LobbyStatus;
  playerCount: number;
  playerIds: string[];
  gameId?: string;
  createdAt: string;
  waitTimerStartedAt?: string;
}

export interface LobbyPlayer {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  countryCode?: string;
  worldRank?: number;
  isHost: boolean;
  isReady: boolean;
  joinedAt: string;
}

export interface LobbyState {
  id: string;
  code: string;
  hostId: string;
  gameMode: GameMode;
  maxPlayers: number;
  minPlayers: number;
  isPrivate: boolean;
  status: LobbyStatus;
  players: LobbyPlayer[];
  timerSeconds: number | null;
  canStart: boolean;
}

export interface CreateLobbyOptions {
  gameMode: GameMode;
  isPrivate: boolean;
  maxPlayers?: number;
}

export interface JoinLobbyOptions {
  code: string;
}
