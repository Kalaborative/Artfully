import { useState } from 'react';
import { useLobbyStore } from '../../store/lobbyStore';
import { useAuthStore } from '../../store/authStore';
import { CountryFlag } from '../profile/CountrySelector';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { Copy, Check, Users, Crown, Clock, Play } from 'lucide-react';

export default function WaitingRoom() {
  const { lobby, timerSeconds, startGame, leaveLobby } = useLobbyStore();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const isHost = lobby?.hostId === user?.$id;
  const canStart = lobby && lobby.players.length >= lobby.minPlayers;

  const copyCode = async () => {
    if (!lobby) return;

    await navigator.clipboard.writeText(lobby.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lobby) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No lobby found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Waiting Room</h2>
            <p className="text-gray-500 text-sm">
              {lobby.gameMode === 'quick' ? 'Quick Game' : 'Normal Game'} • {lobby.isPrivate ? 'Private' : 'Public'}
            </p>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span className="font-mono font-bold text-lg">{lobby.code}</span>
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </Card>

      {/* Timer */}
      {timerSeconds !== null && (
        <Card className="bg-primary-50 border-2 border-primary-200">
          <div className="flex items-center justify-center gap-3 text-primary-700">
            <Clock className="w-6 h-6" />
            <span className="text-2xl font-bold">{timerSeconds}s</span>
            <span className="text-sm">until game starts</span>
          </div>
        </Card>
      )}

      {/* Players */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold">
            Players ({lobby.players.length}/{lobby.maxPlayers})
          </h3>
          {!canStart && (
            <span className="text-sm text-gray-500 ml-auto">
              Need {lobby.minPlayers - lobby.players.length} more to start
            </span>
          )}
        </div>

        <div className="space-y-2">
          {lobby.players.map((player) => (
            <div
              key={player.userId}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <Avatar src={player.avatarUrl} alt={player.displayName} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{player.displayName}</span>
                  {player.isHost && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <span className="text-sm text-gray-500">@{player.username}</span>
              </div>
              {player.countryCode && (
                <CountryFlag code={player.countryCode} size={24} />
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: lobby.maxPlayers - lobby.players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400"
            >
              Waiting for player...
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={leaveLobby}>
          Leave Lobby
        </Button>
        {isHost && (
          <Button
            onClick={startGame}
            disabled={!canStart}
            leftIcon={<Play className="w-5 h-5" />}
          >
            Start Game
          </Button>
        )}
      </div>
    </div>
  );
}
