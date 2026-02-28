import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { SHOP_ITEMS, SHOP_CATEGORIES } from '@artfully/shared';
import type { ShopItem, ShopItemCategory } from '@artfully/shared';
import { useShopStore } from '../store/shopStore';
import { useAuthStore } from '../store/authStore';
import ShopItemCard from '../components/shop/ShopItemCard';
import PurchaseModal from '../components/shop/PurchaseModal';

export default function ShopPage() {
  const { purchasedItems, isLoading, fetchPurchases, purchaseItem, error: shopError } = useShopStore();
  const statistics = useAuthStore((s) => s.statistics);
  const userCoins = statistics?.coins ?? 0;
  const [activeCategory, setActiveCategory] = useState<'all' | ShopItemCategory>('all');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [successItem, setSuccessItem] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const filteredItems = activeCategory === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(item => item.category === activeCategory);

  const handleBuy = (item: ShopItem) => {
    setSelectedItem(item);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return;
    setIsPurchasing(true);
    const success = await purchaseItem(selectedItem.id);
    setIsPurchasing(false);
    if (success) {
      setSuccessItem(selectedItem.id);
      setSelectedItem(null);
      setTimeout(() => setSuccessItem(null), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary-100 rounded-2xl">
          <ShoppingBag className="w-7 h-7 text-primary-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
          <p className="text-gray-500 text-sm">Browse and collect exclusive items</p>
        </div>
      </div>

      {/* Success toast */}
      {successItem && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium text-center animate-fade-in">
          Item acquired successfully!
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {SHOP_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as 'all' | ShopItemCategory)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading shop...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <ShopItemCard
              key={item.id}
              item={item}
              owned={purchasedItems.includes(item.id)}
              userCoins={userCoins}
              onBuy={handleBuy}
            />
          ))}
        </div>
      )}

      {/* Purchase modal */}
      {/* Shop error */}
      {shopError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium text-center">
          {shopError}
        </div>
      )}

      <PurchaseModal
        item={selectedItem}
        isOpen={!!selectedItem}
        userCoins={userCoins}
        onClose={() => setSelectedItem(null)}
        onConfirm={handleConfirmPurchase}
        isLoading={isPurchasing}
      />
    </div>
  );
}
