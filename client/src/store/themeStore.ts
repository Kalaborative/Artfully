import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { useShopStore } from './shopStore';

interface ThemeState {
  activeTheme: string | null;
  setTheme: (themeId: string | null) => void;
  initTheme: () => void;
}

const VALID_THEMES = ['sunset', 'ocean'] as const;

function applyTheme(themeId: string | null) {
  if (themeId && VALID_THEMES.includes(themeId as any)) {
    document.documentElement.setAttribute('data-theme', themeId);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  activeTheme: null,

  setTheme: (themeId: string | null) => {
    const shopItemId = themeId ? `${themeId}-theme` : null;
    if (themeId && !useShopStore.getState().purchasedItems.includes(shopItemId!)) {
      return;
    }
    applyTheme(themeId);
    set({ activeTheme: themeId });
  },

  initTheme: () => {
    const profile = useAuthStore.getState().profile;
    const purchased = useShopStore.getState().purchasedItems;
    const theme = profile?.activeTheme || null;

    if (theme && purchased.includes(`${theme}-theme`)) {
      applyTheme(theme);
      set({ activeTheme: theme });
    } else {
      applyTheme(null);
      set({ activeTheme: null });
    }
  },
}));
