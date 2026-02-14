import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import type { GamePlayer } from '@artfully/shared';
import { Pencil, CheckCircle, Crown } from 'lucide-react';

interface GameLeaderboardProps {
  players: GamePlayer[];
  currentDrawerId: string | null;
}

export default function GameLeaderboard({ players, currentDrawerId }: GameLeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  return (
    <Card padding="sm">
      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">
        Scores
      </h3>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.userId}
            className={`
              flex items-center gap-2 p-2 rounded-lg transition-colors
              ${player.isDrawing ? 'bg-primary-50' : player.hasGuessedCorrectly ? 'bg-green-50' : 'bg-gray-50'}
              ${!player.isConnected ? 'opacity-50' : ''}
            `}
          >
            <span className="text-sm font-bold text-gray-400 w-4">
              {index + 1}
            </span>
            <div className="relative">
              <Avatar src={player.avatarUrl} size="sm" />
              {index === 0 && (
                <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {player.displayName}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {player.isDrawing && (
                <Pencil className="w-4 h-4 text-primary-500" />
              )}
              {player.hasGuessedCorrectly && !player.isDrawing && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className="text-sm font-bold">{player.points}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
