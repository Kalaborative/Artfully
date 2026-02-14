import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import type { GameResults as GameResultsType } from '@artfully/shared';
import { Trophy, Medal, Star, Home, RotateCcw } from 'lucide-react';
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
    useAuthStore.getState().refreshStatistics();
  }, []);

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
            variant="secondary"
            leftIcon={<Home className="w-5 h-5" />}
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          <Button
            leftIcon={<RotateCcw className="w-5 h-5" />}
            onClick={() => navigate('/lobby')}
          >
            Play Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
