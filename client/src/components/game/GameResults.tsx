import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import type { GameResults as GameResultsType } from '@artfully/shared';
import { Trophy, Medal, Star, Home } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface GameResultsProps {
  results: GameResultsType;
}

const rankConfig = [
  { icon: <Trophy className="w-8 h-8" />, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { icon: <Medal className="w-7 h-7" />, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
  { icon: <Medal className="w-6 h-6" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
];

export default function GameResults({ results }: GameResultsProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // Delay stats refresh to give the server time to update the database
    const statsTimeout = setTimeout(() => {
      useAuthStore.getState().refreshStatistics();
    }, 2000);

    // Fire confetti burst
    const end = Date.now() + 1000;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Auto-redirect to home after 5 seconds
    const timeout = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(statsTimeout);
    };
  }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card className="text-center">
        <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
        <p className="text-gray-500 mb-8">
          {results.totalRounds} rounds played
        </p>

        <div className="space-y-4 mb-8">
          {results.players.map((player, index) => {
            const config = rankConfig[index] || {
              icon: <Star className="w-5 h-5" />,
              color: 'text-gray-400',
              bg: 'bg-gray-50',
              border: 'border-gray-100'
            };

            return (
              <div
                key={player.userId}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border-2
                  ${config.bg} ${config.border}
                  ${index === 0 ? 'scale-105' : ''}
                `}
              >
                <div className={`${config.color}`}>
                  {config.icon}
                </div>
                <span className="text-2xl font-bold text-gray-300">
                  #{player.rank}
                </span>
                <Avatar src={player.avatarUrl} size={index === 0 ? 'lg' : 'md'} />
                <div className="flex-1 text-left">
                  <div className="font-bold">{player.displayName}</div>
                  <div className="text-sm text-gray-500">
                    {player.correctGuesses} guessed • {player.firstGuesses} first
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-500">
                    {player.totalPoints}
                  </div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            leftIcon={<Home className="w-5 h-5" />}
            onClick={() => navigate('/')}
          >
            Home
          </Button>
        </div>
        <p className="text-sm text-gray-400 mt-3">Returning to home in 5 seconds...</p>
      </Card>
    </div>
  );
}
