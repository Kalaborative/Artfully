import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import CreateLobbyModal from '../components/lobby/CreateLobbyModal';
import MatchmakingModal from '../components/lobby/MatchmakingModal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import type { GameMode } from '@artfully/shared';
import {
  Play,
  Zap,
  Settings2,
  Trophy,
  Target,
  Gamepad2,
  TrendingUp,
  Award,
  Palette,
  Users,
  ChevronRight,
  PenTool
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, statistics } = useAuthStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [matchmakingMode, setMatchmakingMode] = useState<GameMode>('normal');

  const handleCreated = (code: string) => {
    setShowCreate(false);
    navigate(`/lobby/${code}`);
  };

  const handleMatched = (code: string) => {
    setShowMatchmaking(false);
    navigate(`/lobby/${code}`);
  };

  const startMatchmaking = (mode: GameMode) => {
    setMatchmakingMode(mode);
    setShowMatchmaking(true);
  };

  const displayName = profile?.displayName || user?.name || 'Player';
  const username = profile?.username || user?.email?.split('@')[0] || 'player';

  const stats = {
    gamesPlayed: statistics?.gamesPlayed || 0,
    gamesWon: statistics?.gamesWon || 0,
    totalPoints: statistics?.totalPoints || 0,
    winRate: statistics?.gamesPlayed ? Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100) : 0,
    worldRank: statistics?.worldRank || null,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Avatar
            src={profile?.avatarUrl}
            alt={displayName}
            size="lg"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {displayName}!
            </h1>
            <p className="text-gray-500">@{username}</p>
          </div>
        </div>
      </div>

      {/* Play Actions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-primary-500" />
          Play
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <button
            onClick={() => startMatchmaking('normal')}
            className="group p-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white text-left hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Normal Play</h3>
            <p className="text-primary-100 text-sm">3 rounds, 90 seconds per turn</p>
          </button>

          <button
            onClick={() => startMatchmaking('quick')}
            className="group p-6 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl text-white text-left hover:from-secondary-600 hover:to-secondary-700 transition-all shadow-lg hover:shadow-xl"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Quick Play</h3>
            <p className="text-secondary-100 text-sm">2 rounds, 60 seconds per turn</p>
          </button>

          <button
            onClick={() => setShowCreate(true)}
            className="group p-6 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl text-white text-left hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Settings2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Custom Lobby</h3>
            <p className="text-accent-100 text-sm">Create with your own settings</p>
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          Your Stats
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gamepad2 className="w-6 h-6 text-primary-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.gamesPlayed}</div>
            <div className="text-sm text-gray-500">Games Played</div>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.gamesWon}</div>
            <div className="text-sm text-gray-500">Victories</div>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Points</div>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-accent-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.winRate}%</div>
            <div className="text-sm text-gray-500">Win Rate</div>
          </Card>
        </div>
      </section>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leaderboard Preview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Leaderboard
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/leaderboard')}
              className="text-primary-500"
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {stats.worldRank ? (
            <div className="bg-gradient-to-r from-primary-50 to-transparent p-4 rounded-lg mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  #{stats.worldRank}
                </div>
                <div>
                  <div className="font-semibold">Your Global Rank</div>
                  <div className="text-sm text-gray-500">Keep playing to climb higher!</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-center mb-4">
              <p className="text-gray-500">Play more games to get ranked!</p>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/leaderboard')}
          >
            See Full Leaderboard
          </Button>
        </Card>

        {/* Quick Links */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary-500" />
            Quick Links
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Edit Profile</div>
                <div className="text-sm text-gray-500">Update your avatar and info</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => navigate('/leaderboard')}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Leaderboard</div>
                <div className="text-sm text-gray-500">See top players worldwide</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => navigate('/practice')}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                <PenTool className="w-5 h-5 text-accent-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Practice Mode</div>
                <div className="text-sm text-gray-500">Improve your drawing skills</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <CreateLobbyModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      <MatchmakingModal
        isOpen={showMatchmaking}
        onClose={() => setShowMatchmaking(false)}
        onMatched={handleMatched}
        gameMode={matchmakingMode}
      />
    </div>
  );
}
