import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import DisplayName from '../components/ui/DisplayName';
import { CountryFlag, getCountryName } from '../components/profile/CountrySelector';
import { Trophy, Medal, Star, ChevronLeft, ChevronRight, Globe, ChevronDown, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import type { LeaderboardEntry } from '@artfully/shared';

const countries = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' }, { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' }, { code: 'BE', name: 'Belgium' },
  { code: 'PT', name: 'Portugal' }, { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' }, { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' }, { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' }, { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' }, { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' }, { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' }, { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' }, { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' }, { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' }, { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' }, { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' }, { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' }, { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' }, { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' }, { code: 'IL', name: 'Israel' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'TR', name: 'Turkey' }, { code: 'GR', name: 'Greece' },
  { code: 'RO', name: 'Romania' }, { code: 'HU', name: 'Hungary' },
];

const rankConfig = [
  { icon: <Trophy className="w-6 h-6" />, color: 'text-yellow-500' },
  { icon: <Medal className="w-5 h-5" />, color: 'text-gray-400' },
  { icon: <Medal className="w-5 h-5" />, color: 'text-amber-600' },
];

type Tab = 'global' | 'country';

function CountryDropdown({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );
  const selected = countries.find(c => c.code === value);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
      >
        {selected ? (
          <>
            <CountryFlag code={selected.code} size={16} />
            <span>{selected.name}</span>
          </>
        ) : (
          <span className="text-gray-400">Select country</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map(c => (
              <button
                key={c.code}
                onClick={() => { onChange(c.code); setIsOpen(false); setSearch(''); }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${value === c.code ? 'bg-primary-50 text-primary-700' : ''}`}
              >
                <CountryFlag code={c.code} size={16} />
                <span>{c.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-2 text-sm text-gray-500">No countries found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const { profile } = useAuthStore();
  const [tab, setTab] = useState<Tab>('global');
  const [selectedCountry, setSelectedCountry] = useState(profile?.countryCode || 'US');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const pageSize = 20;

  useEffect(() => {
    setPage(0);
  }, [tab, selectedCountry]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        let url = `${import.meta.env.VITE_SERVER_URL || ''}/api/leaderboard?limit=${pageSize}&offset=${page * pageSize}`;
        if (tab === 'country') {
          url += `&country=${selectedCountry}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        setEntries(data.entries || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [page, tab, selectedCountry]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-gray-500">
          {tab === 'global' ? 'Top players worldwide' : `Top players in ${getCountryName(selectedCountry)}`}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setTab('global')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'global' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          Global
        </button>
        <button
          onClick={() => setTab('country')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'country' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <CountryFlag code={selectedCountry} size={16} />
          Country
        </button>
        {tab === 'country' && (
          <CountryDropdown value={selectedCountry} onChange={setSelectedCountry} />
        )}
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
                    <Avatar src={entry.avatarUrl} alt={entry.username} frame={(entry.activeFrame as any) || null} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {entry.countryCode && (
                          <CountryFlag code={entry.countryCode} size={20} />
                        )}
                        <span className="font-semibold"><DisplayName name={entry.username} effect={entry.activeNameEffect} /></span>
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
