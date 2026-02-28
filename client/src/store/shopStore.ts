import { create } from 'zustand';
import { account } from '../lib/appwrite';
import { useAuthStore } from './authStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

interface ShopState {
  purchasedItems: string[];
  isLoading: boolean;
  error: string | null;
  fetchPurchases: () => Promise<void>;
  purchaseItem: (itemId: string) => Promise<boolean>;
  reset: () => void;
}

async function getAuthHeaders() {
  const jwt = await account.createJWT();
  return { 'Authorization': `Bearer ${jwt.jwt}`, 'Content-Type': 'application/json' };
}

export const useShopStore = create<ShopState>((set) => ({
  purchasedItems: [],
  isLoading: false,
  error: null,

  fetchPurchases: async () => {
    try {
      set({ isLoading: true });
      const headers = await getAuthHeaders();
      const res = await fetch(`${SERVER_URL}/api/shop/purchases`, { headers });
      if (res.ok) {
        const data = await res.json();
        set({ purchasedItems: data.purchasedItems, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('Failed to fetch purchases:', e);
      set({ isLoading: false });
    }
  },

  purchaseItem: async (itemId: string) => {
    try {
      set({ error: null });
      const headers = await getAuthHeaders();
      const res = await fetch(`${SERVER_URL}/api/shop/purchase`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        set((state) => ({ purchasedItems: [...state.purchasedItems, itemId] }));
        useAuthStore.getState().refreshStatistics();
        return true;
      }
      const data = await res.json();
      set({ error: data.error || 'Purchase failed' });
      return false;
    } catch (e) {
      console.error('Failed to purchase item:', e);
      set({ error: 'Purchase failed' });
      return false;
    }
  },

  reset: () => set({ purchasedItems: [], isLoading: false, error: null }),
}));
