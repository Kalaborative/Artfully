import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLobbyStore } from '../store/lobbyStore';
import { useGameStore } from '../store/gameStore';
import WaitingRoom from '../components/lobby/WaitingRoom';
import CreateLobbyModal from '../components/lobby/CreateLobbyModal';
import JoinLobbyModal from '../components/lobby/JoinLobbyModal';
import { Loader2 } from 'lucide-react';

export default function LobbyPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { lobby, joinLobby, setupListeners, wasKicked } = useLobbyStore();
  const { game, isStarting } = useGameStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  // Setup lobby listeners
  useEffect(() => {
    const unsubLobby = setupListeners();

    return () => {
      unsubLobby();
    };
  }, [setupListeners]);

  // Handle kicked redirect
  useEffect(() => {
    if (wasKicked) {
      useLobbyStore.getState().reset();
      navigate('/', { replace: true });
    }
  }, [wasKicked, navigate]);

  // Join lobby if code is provided
  useEffect(() => {
    if (code && !lobby) {
      setIsJoining(true);
      setError(null);

      joinLobby(code)
        .catch((err) => {
          setError(err.message);
          setShowJoin(true);
        })
        .finally(() => {
          setIsJoining(false);
        });
    }
  }, [code, lobby, joinLobby]);

  // Navigate to game if game starting or started
  useEffect(() => {
    console.log('[LobbyPage] Navigation effect - game:', !!game, 'isStarting:', isStarting, 'lobby:', !!lobby);
    if (game) {
      console.log('[LobbyPage] Navigating to game (game started):', game.id);
      navigate(`/game/${game.id}`);
    } else if (isStarting && lobby) {
      console.log('[LobbyPage] Navigating to game (game starting):', lobby.id);
      navigate(`/game/${lobby.id}`);
    }
  }, [game, isStarting, lobby, navigate]);

  // Show modal selection if no code
  useEffect(() => {
    if (!code && !lobby) {
      setShowCreate(true);
    }
  }, [code, lobby]);

  const handleCreated = (newCode: string) => {
    setShowCreate(false);
    navigate(`/lobby/${newCode}`, { replace: true });
  };

  const handleJoined = (newCode: string) => {
    setShowJoin(false);
    setError(null);
    navigate(`/lobby/${newCode}`, { replace: true });
  };

  if (isJoining) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Joining lobby...</p>
        </div>
      </div>
    );
  }

  if (lobby) {
    return (
      <div className="py-8 px-4">
        <WaitingRoom />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Join or Create a Game</h2>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            Create Lobby
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="btn-secondary"
          >
            Join Lobby
          </button>
        </div>
      </div>

      <CreateLobbyModal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          if (!lobby && !code) navigate('/');
        }}
        onCreated={handleCreated}
      />

      <JoinLobbyModal
        isOpen={showJoin}
        onClose={() => {
          setShowJoin(false);
          if (!lobby) navigate('/');
        }}
        onJoined={handleJoined}
        initialCode={code}
      />
    </div>
  );
}
