import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PERSIST_PATH = path.join(__dirname, '../../data/chat-logs.json');
const MAX_ENTRIES = 5000;

export interface ChatLogEntry {
  id: string;
  roomId: string;
  type: 'message' | 'guess' | 'correct_guess' | 'system';
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

function loadLogs(): ChatLogEntry[] {
  try {
    if (fs.existsSync(PERSIST_PATH)) {
      return JSON.parse(fs.readFileSync(PERSIST_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return [];
}

function saveLogs(logs: ChatLogEntry[]) {
  const dir = path.dirname(PERSIST_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PERSIST_PATH, JSON.stringify(logs, null, 2));
}

let logs: ChatLogEntry[] = loadLogs();

export function logChatMessage(entry: Omit<ChatLogEntry, 'id'>) {
  const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  logs.push({ id, ...entry });
  if (logs.length > MAX_ENTRIES) {
    logs = logs.slice(logs.length - MAX_ENTRIES);
  }
  saveLogs(logs);
}

export interface ChatLogFilters {
  roomId?: string;
  username?: string;
  message?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export function getChatLogs(filters: ChatLogFilters = {}) {
  let filtered = [...logs];

  if (filters.roomId) {
    filtered = filtered.filter(l => l.roomId === filters.roomId);
  }
  if (filters.username) {
    const q = filters.username.toLowerCase();
    filtered = filtered.filter(l => l.username.toLowerCase().includes(q));
  }
  if (filters.message) {
    const q = filters.message.toLowerCase();
    filtered = filtered.filter(l => l.message.toLowerCase().includes(q));
  }
  if (filters.type) {
    filtered = filtered.filter(l => l.type === filters.type);
  }

  // Newest first
  filtered.reverse();

  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const start = (page - 1) * limit;

  return {
    logs: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

export function getTotalChatCount(): number {
  return logs.length;
}

export function getChatRooms() {
  const rooms = new Map<string, number>();
  for (const log of logs) {
    rooms.set(log.roomId, (rooms.get(log.roomId) || 0) + 1);
  }
  return Array.from(rooms.entries())
    .map(([roomId, count]) => ({ roomId, count }))
    .sort((a, b) => b.count - a.count);
}
