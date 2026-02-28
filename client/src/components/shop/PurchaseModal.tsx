import Modal from '../ui/Modal';
import type { ShopItem } from '@artfully/shared';

interface PurchaseModalProps {
  item: ShopItem | null;
  isOpen: boolean;
  userCoins: number;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function PurchaseModal({ item, isOpen, userCoins, onClose, onConfirm, isLoading }: PurchaseModalProps) {
  if (!item) return null;

  const canAfford = item.price === 0 || userCoins >= item.price;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Purchase" size="sm">
      <div className="text-center py-4">
        <span className="text-5xl block mb-4">{item.icon}</span>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 mb-6">{item.description}</p>
        <p className="text-lg font-semibold text-gray-900 mb-2">
          {item.price === 0 ? 'Free!' : `${item.price} coins`}
        </p>
        {!canAfford && (
          <p className="text-sm text-red-500 mb-4">
            Not enough coins! You have {userCoins} coins.
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors disabled:opacity-50"
            disabled={isLoading || !canAfford}
          >
            {isLoading ? 'Getting...' : 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
