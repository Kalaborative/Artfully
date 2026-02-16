import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import { CountryFlag } from '../components/profile/CountrySelector';
import DrawingGallery from '../components/profile/DrawingGallery';
import { User, Trophy, Target, Award, ArrowLeft, UserX } from 'lucide-react';
import type { UserProfile, UserStatistics, SavedDrawing } from '@artfully/shared';

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function PlayerProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [drawings, setDrawings] = useState<SavedDrawing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchPlayer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL || ''}/api/users/${encodeURIComponent(username)}`);
        if (response.status === 404) {
          setError('Player not found');
          return;
        }
        if (!response.ok) {
          setError('Failed to load player profile');
          return;
        }
        const data = await response.json();
        const { statistics: stats, ...profileData } = data;
        setProfile(profileData as UserProfile);
        setStatistics(stats as UserStatistics | null);

        // Fetch drawings
        try {
          const drawingsRes = await fetch(`${import.meta.env.VITE_SERVER_URL || ''}/api/drawings/user/${encodeURIComponent(username)}`);
          if (drawingsRes.ok) {
            setDrawings(await drawingsRes.json());
          }
        } catch {
          // Gallery just won't show
        }
      } catch {
        setError('Failed to load player profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayer();
  }, [username]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="text-center">
          <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Player Not Found</h2>
          <p className="text-gray-500 mb-6">
            {error || 'This player does not exist.'}
          </p>
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>
        </Card>
      </div>
    );
  }

  const winRate = statistics && statistics.gamesPlayed > 0
    ? ((statistics.gamesWon / statistics.gamesPlayed) * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/leaderboard"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leaderboard
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <div className="text-center">
            <Avatar src={profile.avatarUrl} alt={profile.displayName} size="xl" className="mx-auto" />
            <h2 className="text-xl font-bold mt-4 flex items-center justify-center gap-2">
              {profile.countryCode && (
                <CountryFlag code={profile.countryCode} size={24} />
              )}
              {profile.displayName}
            </h2>
            <p className="text-gray-500">@{profile.username}</p>
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Statistics
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatBox
              icon={<Target className="w-5 h-5 text-blue-500" />}
              label="Games Played"
              value={statistics?.gamesPlayed || 0}
            />
            <StatBox
              icon={<Award className="w-5 h-5 text-yellow-500" />}
              label="Games Won"
              value={statistics?.gamesWon || 0}
            />
            <StatBox
              icon={<Trophy className="w-5 h-5 text-green-500" />}
              label="Win Rate"
              value={`${winRate}%`}
            />
            <StatBox
              icon={<User className="w-5 h-5 text-purple-500" />}
              label="Total Points"
              value={statistics?.totalPoints || 0}
            />
            <StatBox
              icon={<Target className="w-5 h-5 text-orange-500" />}
              label="World Rank"
              value={statistics?.worldRank ? `#${statistics.worldRank}` : '-'}
            />
            <StatBox
              icon={<Target className="w-5 h-5 text-teal-500" />}
              label="Country Rank"
              value={statistics?.countryRank ? `#${statistics.countryRank}` : '-'}
            />
          </div>
        </Card>
      </div>

      {/* Gallery */}
      {drawings.length > 0 && (
        <div className="mt-6">
          <DrawingGallery drawings={drawings} isOwner={false} />
        </div>
      )}
    </div>
  );
}
