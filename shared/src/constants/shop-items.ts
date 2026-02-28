export type ShopItemCategory = 'drawing' | 'profile' | 'gameplay';
export type ShopItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopItemCategory;
  price: number;
  icon: string;
  rarity: ShopItemRarity;
}

export interface UserPurchase {
  id: string;
  userId: string;
  itemId: string;
  purchasedAt: string;
}

export const SHOP_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'drawing', label: 'Drawing' },
  { id: 'profile', label: 'Profile' },
  { id: 'gameplay', label: 'Gameplay' },
] as const;

export const SHOP_ITEMS: ShopItem[] = [
  // Drawing
  { id: 'neon-brush', name: 'Neon Brush', description: 'A glowing neon brush that makes your drawings stand out.', category: 'drawing', price: 2500, icon: '✨', rarity: 'rare' },
  { id: 'glitter-brush', name: 'Glitter Brush', description: 'Scatter sparkling glitter particles as you draw.', category: 'drawing', price: 1000, icon: '💎', rarity: 'common' },
  { id: 'sunset-theme', name: 'Sunset Theme', description: 'Transform your entire UI with warm sunset colors and Public Sans typography.', category: 'profile', price: 5000, icon: '🌅', rarity: 'epic' },
  { id: 'ocean-theme', name: 'Ocean Theme', description: 'Transform your entire UI with deep ocean blues and cool cyan typography.', category: 'profile', price: 5000, icon: '🌊', rarity: 'epic' },

  // Profile
  { id: 'gold-frame', name: 'Gold Frame', description: 'A prestigious gold frame around your profile avatar.', category: 'profile', price: 10000, icon: '🖼️', rarity: 'legendary' },
  { id: 'rainbow-frame', name: 'Rainbow Frame', description: 'A colorful rainbow frame for your avatar.', category: 'profile', price: 5000, icon: '🌈', rarity: 'epic' },
  { id: 'fire-name', name: 'Fire Name', description: 'Your display name gets a fiery effect.', category: 'profile', price: 2500, icon: '🔥', rarity: 'rare' },
  { id: 'og-badge', name: 'OG Badge', description: 'Show everyone you were here from the start.', category: 'profile', price: 10000, icon: '🏅', rarity: 'legendary' },

  // Gameplay
  { id: 'extra-save-slots', name: 'Extra Save Slots', description: 'Get 3 additional drawing save slots.', category: 'gameplay', price: 1000, icon: '💾', rarity: 'common' },
  { id: 'dance-emote', name: 'Dance Emote', description: 'Celebrate wins with a fun dance emote.', category: 'gameplay', price: 2500, icon: '💃', rarity: 'rare' },
  { id: 'fireworks-emote', name: 'Fireworks Emote', description: 'Light up the screen with fireworks after a win.', category: 'gameplay', price: 5000, icon: '🎆', rarity: 'epic' },
];
