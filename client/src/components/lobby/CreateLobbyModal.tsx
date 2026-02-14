import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLobbyStore } from '../../store/lobbyStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Lock, Globe, LogIn } from 'lucide-react';

interface CreateLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (code: string) => void;
}

export default function CreateLobbyModal({ isOpen, onClose, onCreated }: CreateLobbyModalProps) {
  const navigate = useNavigate();
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { createLobby, isCreating, error, joinLobby } = useLobbyStore();

  const handleCreate = async () => {
    try {
      const lobby = await createLobby({ gameMode: 'normal', isPrivate });
      onCreated(lobby.code);
    } catch {
      // Error is handled in store
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim();
    if (!code) return;
    setJoinError('');
    setIsJoining(true);
    try {
      await joinLobby(code);
      onClose();
      navigate(`/lobby/${code}`);
    } catch {
      setJoinError('Could not join lobby. Check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Custom Lobby" size="sm">
      <div className="space-y-6">
        {(error || joinError) && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error || joinError}
          </div>
        )}

        {/* Join existing lobby */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Join with Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="Enter lobby code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase tracking-widest"
              maxLength={10}
            />
            <Button onClick={handleJoin} isLoading={isJoining} disabled={!joinCode.trim()}>
              <LogIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-gray-400">or create a new lobby</span>
          </div>
        </div>

        {/* Visibility Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Lobby Visibility
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsPrivate(false)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${!isPrivate
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <Globe className="w-6 h-6 text-green-500 mb-2" />
              <div className="font-medium">Public</div>
              <div className="text-sm text-gray-500">Anyone can join</div>
            </button>
            <button
              onClick={() => setIsPrivate(true)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${isPrivate
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <Lock className="w-6 h-6 text-gray-500 mb-2" />
              <div className="font-medium">Private</div>
              <div className="text-sm text-gray-500">Invite only</div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleCreate} isLoading={isCreating} className="flex-1">
            Create Lobby
          </Button>
        </div>
      </div>
    </Modal>
  );
}
