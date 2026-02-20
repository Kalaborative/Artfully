import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import { CountryFlag } from '../components/profile/CountrySelector';
import { Trophy, Medal, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LeaderboardEntry } from '@artfully/shared';

const rankConfig = [
  { icon: <Trophy className="w-6 h-6" />, color: 'text-yellow-500' },
  { icon: <Medal className="w-5 h-5" />, color: 'text-gray-400' },
  { icon: <Medal className="w-5 h-5" />, color: 'text-amber-600' },
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const pageSize = 20;

  useEffect(() => {
    fetchLeaderboard();
  }, [page]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || ''}/api/leaderboard?limit=${pageSize}&offset=${page * pageSize}`);
      const data = await response.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-gray-500">Top players worldwide</p>
      </div>

      <Card>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No players yet. Be the first!
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const globalRank = page * pageSize + index;
                const config = rankConfig[globalRank] || {
                  icon: <Star className="w-4 h-4" />,
                  color: 'text-gray-400'
                };

                return (
                  <Link
                    key={entry.userId}
                    to={`/player/${entry.username}`}
                    className={`
                      flex items-center gap-4 p-4 rounded-lg transition-colors cursor-pointer
                      ${globalRank < 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent hover:from-yellow-100' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className={`w-8 text-center ${config.color}`}>
                      {globalRank < 3 ? config.icon : entry.rank}
                    </div>
                    <Avatar src={entry.avatarUrl} alt={entry.username} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {entry.countryCode && (
                          <CountryFlag code={entry.countryCode} size={20} />
                        )}
                        <span className="font-semibold">{entry.username}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-500">{entry.totalPoints}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-500">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
