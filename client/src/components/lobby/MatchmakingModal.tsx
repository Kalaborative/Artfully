import { useState, useEffect } from 'react';
import { useLobbyStore } from '../../store/lobbyStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { GameMode } from '@artfully/shared';
import { Users, Loader2, Play, Zap } from 'lucide-react';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatched: (code: string) => void;
  gameMode: GameMode;
}

export default function MatchmakingModal({ isOpen, onClose, onMatched, gameMode }: MatchmakingModalProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [dots, setDots] = useState('');
  const { joinMatchmaking, leaveMatchmaking, playersInQueue, error } = useLobbyStore();

  // Animate the dots
  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isSearching]);

  // Start searching when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSearching(true);
      handleJoinQueue();
    } else {
      setIsSearching(false);
    }
  }, [isOpen]);

  const handleJoinQueue = async () => {
    try {
      const lobby = await joinMatchmaking(gameMode);
      if (lobby) {
        onMatched(lobby.code);
      }
    } catch {
      // Error handled in store
    }
  };

  const handleCancel = () => {
    leaveMatchmaking();
    setIsSearching(false);
    onClose();
  };

  const modeConfig = {
    normal: {
      icon: <Play className="w-8 h-8" />,
      title: 'Normal Mode',
      description: '3 rounds, 90 seconds per turn',
      color: 'text-primary-500',
      bgColor: 'bg-primary-100',
    },
    quick: {
      icon: <Zap className="w-8 h-8" />,
      title: 'Quick Mode',
      description: '2 rounds, 60 seconds per turn',
      color: 'text-secondary-500',
      bgColor: 'bg-secondary-100',
    },
  };

  const config = modeConfig[gameMode];

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Finding Game" size="sm">
      <div className="text-center py-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Mode indicator */}
        <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 ${config.color}`}>
          {config.icon}
        </div>
        <h3 className="text-lg font-semibold mb-1">{config.title}</h3>
        <p className="text-sm text-gray-500 mb-6">{config.description}</p>

        {/* Searching animation */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            <span className="text-gray-700">
              Searching for players{dots}
            </span>
          </div>

          {/* Players in queue */}
          <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {playersInQueue} player{playersInQueue !== 1 ? 's' : ''} in queue
            </span>
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-1 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <Button variant="secondary" onClick={handleCancel} className="w-full">
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
