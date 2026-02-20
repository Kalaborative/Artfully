import { create } from 'zustand';
import { account } from '../lib/appwrite';
import type { UserNotification } from '@artfully/shared';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

interface NotificationState {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  reset: () => void;
}

async function getAuthHeaders() {
  const jwt = await account.createJWT();
  return { 'Authorization': `Bearer ${jwt.jwt}`, 'Content-Type': 'application/json' };
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const headers = await getAuthHeaders();
      const res = await fetch(`${SERVER_URL}/api/notifications`, { headers });
      if (res.ok) {
        const data = await res.json();
        set({ notifications: data.notifications, isLoading: false });
      } else {
        console.error('Failed to fetch notifications:', res.status);
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SERVER_URL}/api/notifications/unread-count`, { headers });
      if (res.ok) {
        const data = await res.json();
        set({ unreadCount: data.count });
      }
    } catch (e) {
      console.error('Failed to fetch unread count:', e);
    }
  },

  markAllRead: async () => {
    try {
      const headers = await getAuthHeaders();
      await fetch(`${SERVER_URL}/api/notifications/read`, {
        method: 'PATCH',
        headers,
      });
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      }));
    } catch {
      // Silently fail
    }
  },

  markRead: async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(`${SERVER_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers,
      });
      set((state) => ({
        unreadCount: Math.max(0, state.unreadCount - 1),
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      }));
    } catch {
      // Silently fail
    }
  },

  reset: () => {
    set({ notifications: [], unreadCount: 0, isLoading: false });
  },
}));
