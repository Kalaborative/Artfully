import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import GameRoom from '../components/game/GameRoom';

export default function GamePage() {
  const { id: _id } = useParams();
  const navigate = useNavigate();
  const { game, results, isStarting } = useGameStore();
  const hasEverHadGame = useRef(false);

  // Track if we've ever had a game or starting state
  if (game || isStarting || results) {
    hasEverHadGame.current = true;
  }

  // Only redirect if we've never seen any game activity and some time has passed
  useEffect(() => {
    if (hasEverHadGame.current) return;

    const timeout = setTimeout(() => {
      const state = useGameStore.getState();
      if (!state.game && !state.results && !state.isStarting) {
        navigate('/lobby');
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return <GameRoom />;
}
