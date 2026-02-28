import type { ShopItem } from '@artfully/shared';

const RARITY_COLORS = {
  common: 'bg-gray-100 text-gray-600',
  rare: 'bg-blue-100 text-blue-600',
  epic: 'bg-purple-100 text-purple-600',
  legendary: 'bg-amber-100 text-amber-600',
};

interface ShopItemCardProps {
  item: ShopItem;
  owned: boolean;
  userCoins: number;
  onBuy: (item: ShopItem) => void;
}

export default function ShopItemCard({ item, owned, userCoins, onBuy }: ShopItemCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow">
      <span className="text-4xl mb-3">{item.icon}</span>
      <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${RARITY_COLORS[item.rarity]}`}>
        {item.rarity}
      </span>
      <p className="text-sm text-gray-500 mb-4 flex-1">{item.description}</p>
      <div className="w-full">
        {owned ? (
          <span className="block w-full py-2 text-center text-sm font-medium text-green-600 bg-green-50 rounded-xl">
            Owned
          </span>
        ) : (
          <button
            onClick={() => onBuy(item)}
            disabled={item.price > 0 && userCoins < item.price}
            className="w-full py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {item.price === 0 ? 'Get Free' : `${item.price} coins`}
          </button>
        )}
      </div>
    </div>
  );
}
