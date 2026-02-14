import { useState } from 'react';
import { useLobbyStore } from '../../store/lobbyStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Hash } from 'lucide-react';

interface JoinLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (code: string) => void;
  initialCode?: string;
}

export default function JoinLobbyModal({ isOpen, onClose, onJoined, initialCode = '' }: JoinLobbyModalProps) {
  const [code, setCode] = useState(initialCode);
  const { joinLobby, isJoining, error } = useLobbyStore();

  const handleJoin = async () => {
    if (!code.trim()) return;

    try {
      const lobby = await joinLobby(code.toUpperCase());
      onJoined(lobby.code);
    } catch {
      // Error is handled in store
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric and uppercase
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(value.slice(0, 8));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Lobby" size="sm">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input
          label="Lobby Code"
          value={code}
          onChange={handleCodeChange}
          placeholder="Enter 8-character code"
          leftIcon={<Hash className="w-5 h-5" />}
          maxLength={8}
          autoFocus
        />

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            isLoading={isJoining}
            disabled={code.length !== 8}
          >
            Join Lobby
          </Button>
        </div>
      </div>
    </Modal>
  );
}
