import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { account } from '../lib/appwrite';
import CreateLobbyModal from '../components/lobby/CreateLobbyModal';
import MatchmakingModal from '../components/lobby/MatchmakingModal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import AnnouncementModal from '../components/ui/AnnouncementModal';
import type { GameMode } from '@artfully/shared';
import {
  Play,
  Zap,
  Settings2,
  Gamepad2,
  Award,
  ChevronRight,
  PenTool,
  MessageSquare,
  Trophy,
  ShoppingBag,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const isSunset = activeTheme === 'sunset';
  const isOcean = activeTheme === 'ocean';
  const isThemed = isSunset || isOcean;
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [matchmakingMode, setMatchmakingMode] = useState<GameMode>('normal');
  const [inviteCode, setInviteCode] = useState('');
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feedback' | 'suggestion'>('feedback');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) return;

    setFeedbackSubmitting(true);
    setFeedbackStatus(null);

    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const jwt = await account.createJWT();
      const res = await fetch(`${serverUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt.jwt}`,
        },
        body: JSON.stringify({
          type: feedbackType,
          message: feedbackMessage.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setFeedbackMessage('');
      setFeedbackType('feedback');
      setFeedbackStatus({ type: 'success', message: 'Thanks for your feedback!' });
    } catch (err: any) {
      setFeedbackStatus({ type: 'error', message: err.message || 'Failed to submit feedback' });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const displayName = profile?.displayName || user?.name || 'Player';
  const username = profile?.username || user?.email?.split('@')[0] || 'player';

  return (
    <div className="flex flex-col md:flex-row gap-0 min-h-[calc(100vh-80px)]">

      {/* ── Left Navigation Panel ─────────────────────────────────────── */}
      <aside className="w-full md:w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        {/* User info */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar src={profile?.avatarUrl} alt={displayName} size="sm" />
            <div className="min-w-0">
              <div className="font-bold text-gray-900 truncate">{displayName}</div>
              <div className="text-xs text-gray-400 truncate">@{username}</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          <p className="text-[10px] font-bold tracking-widest text-primary-400 uppercase px-3 mb-3">
            Main Menu
          </p>

          <button
            onClick={() => navigate('/hall-of-fame')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 transition-colors text-left text-gray-700 hover:text-primary-600 group"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Award className="w-4 h-4 text-primary-500" />
            </div>
            <span className="font-semibold text-sm">Wonder Hall</span>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-primary-400" />
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-50 transition-colors text-left text-gray-700 hover:text-yellow-600 group"
          >
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
              <Trophy className="w-4 h-4 text-yellow-500" />
            </div>
            <span className="font-semibold text-sm">Leaderboard</span>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-yellow-400" />
          </button>

          <button
            onClick={() => navigate('/practice')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent-50 transition-colors text-left text-gray-700 hover:text-accent-600 group"
          >
            <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center group-hover:bg-accent-200 transition-colors">
              <PenTool className="w-4 h-4 text-accent-500" />
            </div>
            <span className="font-semibold text-sm">Practice Mode</span>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-accent-400" />
          </button>

          <button
            onClick={() => navigate('/shop')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-pink-50 transition-colors text-left text-gray-700 hover:text-pink-600 group"
          >
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
              <ShoppingBag className="w-4 h-4 text-pink-500" />
            </div>
            <span className="font-semibold text-sm">Shop</span>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-pink-400" />
          </button>
        </nav>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 bg-cream-50">

        {/* Hero Section */}
        <section className={`relative rounded-[2rem] overflow-hidden mb-8 min-h-[380px] flex items-center shadow-xl ${
          isSunset
            ? 'bg-gradient-to-br from-[#7c2d12] via-[#c2410c] to-[#f97316]'
            : isOcean
              ? 'bg-gradient-to-br from-[#0c1445] via-[#1e3a8a] to-[#1d4ed8]'
              : 'bg-gradient-to-br from-[#2d1b4e] to-[#4a2a8a]'
        }`}>
          {/* Scanlines overlay (default only) */}
          {!isThemed && <div className="absolute inset-0 scanlines opacity-40 z-20 pointer-events-none" />}

          {/* Animated radial pulse / sunset glow */}
          {isSunset ? (
            <>
              {/* Warm sun glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,_rgba(251,146,60,0.5)_0%,_transparent_60%)] z-10 animate-pulse" />
              {/* Horizon haze */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#fef3c7]/20 to-transparent z-10" />
              {/* Sun orb – top-left, behind text */}
              <div className="absolute left-[8%] top-[8%] w-36 h-36 rounded-full bg-[radial-gradient(circle,_#fde68a_0%,_#f97316_50%,_transparent_70%)] opacity-80 z-10 animate-[sunPulse_4s_ease-in-out_infinite]" />
              {/* Drifting clouds */}
              <svg className="absolute top-[12%] left-0 w-44 h-20 z-10 animate-[cloudDrift_22s_linear_infinite]" viewBox="0 0 1200 1200" fill="white" opacity="0.12">
                <path d="M949.301,499.669c-9.341,0-18.281,0.855-27.36,2.113c0-0.751,0.104-1.434,0.104-2.113c0-110.825-89.873-200.699-200.63-200.699c-96.107,0-176.164,67.541-196,157.586c-27.486-21.006-61.569-33.543-98.796-33.543c-88.754,0-160.711,70.598-163.368,158.741c-15.646-4.992-32.371-7.807-49.765-7.807C123.195,573.947,50,647.127,50,737.49c0,90.31,73.195,163.54,163.486,163.54h735.815c110.825,0,200.699-89.905,200.699-200.731C1150,589.42,1060.127,499.669,949.301,499.669z"/>
              </svg>
              <svg className="absolute top-[38%] left-[-10%] w-56 h-24 z-10 animate-[cloudDrift_28s_linear_infinite_3s]" viewBox="0 0 1200 1200" fill="white" opacity="0.1">
                <path d="M949.301,499.669c-9.341,0-18.281,0.855-27.36,2.113c0-0.751,0.104-1.434,0.104-2.113c0-110.825-89.873-200.699-200.63-200.699c-96.107,0-176.164,67.541-196,157.586c-27.486-21.006-61.569-33.543-98.796-33.543c-88.754,0-160.711,70.598-163.368,158.741c-15.646-4.992-32.371-7.807-49.765-7.807C123.195,573.947,50,647.127,50,737.49c0,90.31,73.195,163.54,163.486,163.54h735.815c110.825,0,200.699-89.905,200.699-200.731C1150,589.42,1060.127,499.669,949.301,499.669z"/>
              </svg>
              <svg className="absolute top-[60%] left-[-5%] w-36 h-16 z-10 animate-[cloudDrift_20s_linear_infinite_8s]" viewBox="0 0 1200 1200" fill="white" opacity="0.12">
                <path d="M949.301,499.669c-9.341,0-18.281,0.855-27.36,2.113c0-0.751,0.104-1.434,0.104-2.113c0-110.825-89.873-200.699-200.63-200.699c-96.107,0-176.164,67.541-196,157.586c-27.486-21.006-61.569-33.543-98.796-33.543c-88.754,0-160.711,70.598-163.368,158.741c-15.646-4.992-32.371-7.807-49.765-7.807C123.195,573.947,50,647.127,50,737.49c0,90.31,73.195,163.54,163.486,163.54h735.815c110.825,0,200.699-89.905,200.699-200.731C1150,589.42,1060.127,499.669,949.301,499.669z"/>
              </svg>
            </>
          ) : isOcean ? (
            <>
              {/* Deep ocean glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,_rgba(6,182,212,0.3)_0%,_transparent_60%)] z-10 animate-pulse" />
              {/* Ocean floor gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0c1445]/60 to-transparent z-10" />
              {/* Animated wave layers */}
              <svg className="absolute bottom-0 left-0 w-[200%] h-24 z-10 animate-[waveDrift_6s_ease-in-out_infinite]" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
                <path d="M0,80 C360,20 720,120 1080,60 C1260,30 1440,80 1440,80 L1440,120 L0,120 Z" fill="rgba(6,182,212,0.1)"/>
              </svg>
              <svg className="absolute bottom-0 left-0 w-[200%] h-20 z-10 animate-[waveDrift_8s_ease-in-out_infinite_1s]" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
                <path d="M0,90 C320,40 640,110 960,70 C1200,40 1440,90 1440,90 L1440,120 L0,120 Z" fill="rgba(96,165,250,0.08)"/>
              </svg>
              {/* Floating bubbles */}
              <div className="absolute bottom-[20%] left-[15%] w-6 h-6 rounded-full bg-cyan-300/30 z-10 animate-[bubbleRise_5s_ease-in_infinite]" />
              <div className="absolute bottom-[10%] left-[40%] w-5 h-5 rounded-full bg-cyan-200/25 z-10 animate-[bubbleRise_7s_ease-in_infinite_2s]" />
              <div className="absolute bottom-[15%] left-[65%] w-7 h-7 rounded-full bg-blue-300/30 z-10 animate-[bubbleRise_6s_ease-in_infinite_4s]" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(20,184,166,0.3)_0%,_transparent_70%)] z-10 animate-pulse" />
          )}

          {/* Text + buttons */}
          <div className="relative z-30 px-10 py-10 max-w-2xl">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest mb-5 uppercase ${
              isSunset
                ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                : isOcean
                  ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-300/30'
                  : 'bg-primary-500/20 text-primary-300 border border-primary-400/30'
            }`}>
              Welcome back, {displayName}!
            </div>

            <h1 className="text-5xl font-black text-white mb-5 leading-tight tracking-tight">
              START YOUR<br />
              <span className={isSunset ? 'text-amber-200' : isOcean ? 'text-cyan-200' : 'text-primary-300'}>ADVENTURE</span>
            </h1>

            <p className={`text-base font-medium mb-8 leading-relaxed max-w-md ${
              isSunset ? 'text-orange-100' : isOcean ? 'text-blue-100' : 'text-slate-300'
            }`}>
              Enter the immersive canvas. Duel other artists in real-time or master your craft solo.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {/* Normal Play */}
              <button
                onClick={() => startMatchmaking('normal')}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-base hover:scale-105 active:scale-95 transition-all ${
                  isSunset
                    ? 'bg-white text-orange-900 shadow-[0_0_20px_rgba(249,115,22,0.6)]'
                    : isOcean
                      ? 'bg-white text-blue-900 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                      : 'glowing-btn bg-white text-gray-900'
                }`}
              >
                <Play className={`w-5 h-5 ${isSunset ? 'text-orange-600' : isOcean ? 'text-blue-600' : 'text-primary-600'}`} />
                NORMAL PLAY
              </button>

              {/* Quick Play */}
              <button
                onClick={() => startMatchmaking('quick')}
                className="flex items-center gap-2 border-2 border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-2xl font-black text-base hover:bg-white/10 transition-all"
              >
                <Zap className="w-5 h-5" />
                QUICK PLAY
              </button>
            </div>
          </div>

          {/* Animated decoration – right side */}
          <div className="absolute right-10 bottom-0 top-0 w-1/3 hidden lg:flex items-center justify-center pointer-events-none">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Bouncing icon box */}
              <div className={`w-52 h-52 rounded-[2.5rem] rotate-12 flex items-center justify-center animate-bounce overflow-hidden ${
                isSunset
                  ? 'bg-gradient-to-tr from-[#ea580c] to-[#fbbf24] shadow-[0_0_60px_rgba(249,115,22,0.4)]'
                  : isOcean
                    ? 'bg-gradient-to-tr from-[#1e3a8a] to-[#06b6d4] shadow-[0_0_60px_rgba(6,182,212,0.4)]'
                    : 'bg-gradient-to-tr from-primary-500 to-secondary-400 shadow-[0_0_60px_rgba(20,184,166,0.4)]'
              }`}>
                <Gamepad2 className="w-28 h-28 text-white/90" />
                {!isThemed && <div className="absolute inset-0 scanlines bg-white/10 pointer-events-none" />}
              </div>
              {/* Ping rings */}
              <div className={`absolute top-1/4 right-0 w-20 h-20 border-4 rounded-full animate-ping ${
                isSunset ? 'border-amber-300/30' : isOcean ? 'border-cyan-300/30' : 'border-primary-300/30'
              }`} />
              <div className={`absolute bottom-1/4 left-0 w-14 h-14 border-4 rounded-lg rotate-45 ${
                isSunset ? 'border-orange-300/30' : isOcean ? 'border-blue-300/30' : 'border-secondary-300/30'
              }`} />
            </div>
          </div>
        </section>

        {/* Bottom row: Custom Lobby + Feedback */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Private Lobby */}
          <Card className="flex flex-col bg-accent-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-accent-500" />
              Private Lobby
            </h3>

            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm text-gray-500 mb-5">Create a password-protected space to draw with your friends only.</p>

              {/* Create button */}
              <button
                onClick={() => setShowCreate(true)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-accent-500 text-white hover:bg-accent-600 active:scale-95 transition-all shadow-md shadow-accent-200"
              >
                Create Private Room
              </button>

              {/* OR divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-bold text-gray-400 tracking-widest">OR</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Invite code */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter' && inviteCode.trim()) navigate(`/lobby/${inviteCode.trim()}`); }}
                  placeholder="Invite Code"
                  maxLength={8}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-accent-400 focus:border-accent-400 outline-none transition-all placeholder-gray-400 font-medium tracking-wider"
                />
                <button
                  onClick={() => { if (inviteCode.trim()) navigate(`/lobby/${inviteCode.trim()}`); }}
                  disabled={!inviteCode.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </div>
            </div>
          </Card>

          {/* Feedback */}
          <Card className="bg-primary-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              Send Us Feedback
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="flex gap-2">
                  {([
                    { value: 'bug', label: 'Bug' },
                    { value: 'feedback', label: 'Feedback' },
                    { value: 'suggestion', label: 'Suggestion' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedbackType(value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${feedbackType === value
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  maxLength={2000}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-vertical"
                />
                <p className="text-xs text-gray-400 mt-1">{feedbackMessage.length}/2000</p>
              </div>

              {feedbackStatus && (
                <div className={`p-3 rounded-lg text-sm ${feedbackStatus.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
                  }`}>
                  {feedbackStatus.message}
                </div>
              )}

              <Button
                onClick={handleFeedbackSubmit}
                isLoading={feedbackSubmitting}
                disabled={!feedbackMessage.trim() || feedbackSubmitting}
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                Submit Feedback
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Announcement */}
      <AnnouncementModal />

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
