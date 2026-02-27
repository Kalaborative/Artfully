import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { account } from '../lib/appwrite';
import CreateLobbyModal from '../components/lobby/CreateLobbyModal';
import JoinLobbyModal from '../components/lobby/JoinLobbyModal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AnnouncementModal from '../components/ui/AnnouncementModal';
import { Palette, Users, Trophy, Plus, Hash, PenTool, MessageSquare } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feedback' | 'suggestion'>('feedback');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreated = (code: string) => {
    setShowCreate(false);
    navigate(`/lobby/${code}`);
  };

  const handleJoined = (code: string) => {
    setShowJoin(false);
    navigate(`/lobby/${code}`);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) return;

    setFeedbackSubmitting(true);
    setFeedbackStatus(null);

    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (isAuthenticated) {
        const jwt = await account.createJWT();
        headers.Authorization = `Bearer ${jwt.jwt}`;
      }

      const res = await fetch(`${serverUrl}/api/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: feedbackType,
          message: feedbackMessage.trim(),
          ...(!isAuthenticated && feedbackEmail.trim() ? { email: feedbackEmail.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setFeedbackMessage('');
      setFeedbackEmail('');
      setFeedbackType('feedback');
      setFeedbackStatus({ type: 'success', message: 'Thanks for your feedback!' });
    } catch (err: any) {
      setFeedbackStatus({ type: 'error', message: err.message || 'Failed to submit feedback' });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // ── Authenticated view (unchanged) ────────────────────────────────────────
  if (isAuthenticated) {
    return (
      <div className="min-h-[80vh]">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-500 to-primary-600 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">Draw. Guess. Win!</h1>
            <p className="text-xl text-primary-100 mb-8">
              The ultimate multiplayer drawing game. Challenge your friends and show off your artistic skills!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Plus className="w-5 h-5" />}
                onClick={() => setShowCreate(true)}
              >
                Create Game
              </Button>
              <Button
                variant="outline"
                size="lg"
                leftIcon={<Hash className="w-5 h-5" />}
                onClick={() => setShowJoin(true)}
                className="bg-white/10 border-white text-white hover:bg-white/20"
              >
                Join with Code
              </Button>
              <Button
                variant="outline"
                size="lg"
                leftIcon={<PenTool className="w-5 h-5" />}
                onClick={() => navigate('/practice')}
                className="bg-white/10 border-white text-white hover:bg-white/20"
              >
                Practice
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Artfully?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card hover className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pro Drawing Tools</h3>
                <p className="text-gray-600">Multiple brushes, colors, and tools to bring your drawings to life.</p>
              </Card>
              <Card hover className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Play with Friends</h3>
                <p className="text-gray-600">Create private lobbies and invite friends with a simple code.</p>
              </Card>
              <Card hover className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Climb the Ranks</h3>
                <p className="text-gray-600">Compete globally and see your name on the leaderboard.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* How to Play */}
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How to Play</h2>
            <div className="space-y-6">
              {[
                { step: 1, title: 'Join a Game', desc: 'Create a lobby or join with a code' },
                { step: 2, title: 'Take Turns Drawing', desc: "When it's your turn, draw the word you're given" },
                { step: 3, title: 'Guess Fast', desc: 'Type your guesses to earn points - faster guesses mean more points!' },
                { step: 4, title: 'Win!', desc: 'The player with the most points at the end wins' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold shrink-0">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <p className="text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <MessageSquare className="w-10 h-10 text-primary-500 mx-auto mb-3" />
              <h2 className="text-3xl font-bold">Send Us Feedback</h2>
              <p className="text-gray-600 mt-2">Found a bug? Have a suggestion? Let us know!</p>
            </div>
            <Card>
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
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-vertical"
                  />
                  <p className="text-xs text-gray-400 mt-1">{feedbackMessage.length}/2000</p>
                </div>
                {feedbackStatus && (
                  <div className={`p-3 rounded-lg text-sm ${feedbackStatus.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
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
        </section>

        <AnnouncementModal />
        <CreateLobbyModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
        <JoinLobbyModal isOpen={showJoin} onClose={() => setShowJoin(false)} onJoined={handleJoined} />
      </div>
    );
  }

  // ── Unauthenticated splash page ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fffdf5] font-sans text-slate-800 overflow-x-hidden">

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-[#fffdf5]/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-[#38bdf8] p-1.5 rounded-xl -rotate-6">
              <span className="material-symbols-outlined text-xl text-white leading-none">auto_fix_high</span>
            </div>
            <span className="font-display font-black text-2xl text-slate-900 tracking-tight">Artfully</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="font-display font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="font-display font-bold text-white bg-[#4ade80] px-5 py-2 rounded-xl shadow-[0_4px_0_0_#15803d] hover:shadow-[0_2px_0_0_#15803d] hover:translate-y-0.5 transition-all"
            >
              Start Doodling!
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 py-16 md:py-28 lg:px-24 flex flex-col lg:flex-row items-center gap-16 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#fde047]/30 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-[#f472b6]/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-10 left-1/4 w-40 h-40 bg-[#4ade80]/20 -z-10 rotate-45" style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }} />

        {/* Left copy */}
        <div className="lg:w-1/2 flex flex-col gap-8 z-10">
          {/* Speech bubble */}
          <div className="relative self-start bg-white px-5 py-3 rounded-3xl shadow-xl border-2 border-slate-100 -rotate-2">
            <p className="font-display text-[#f472b6] font-bold text-lg">Psst… Grab a brush! ✨</p>
            <span className="absolute -bottom-[10px] left-5 border-[10px] border-solid border-t-white border-x-transparent border-b-transparent" />
          </div>

          <h1 className="font-display font-black text-5xl md:text-7xl leading-tight text-slate-900">
            The Ultimate{' '}
            <span className="text-[#38bdf8] relative inline-block">
              Social Pictionary
            </span>
            {' '}Game!
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-lg">
            Artfully is a drawing guessing multiplayer online game. Compete with people around the world, doodle wild things, and guess your way to victory!
          </p>

          <div className="flex flex-wrap gap-5">
            <button
              onClick={() => navigate('/register')}
              className="group flex items-center gap-3 bg-[#4ade80] px-9 py-5 font-display font-black text-2xl text-white shadow-[0_8px_0_0_#15803d] hover:shadow-[0_2px_0_0_#15803d] hover:translate-y-1.5 transition-all"
              style={{ borderRadius: '2rem' }}
            >
              Start Doodling!
              <span className="material-symbols-outlined text-3xl group-hover:rotate-45 transition-transform">brush</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 border-4 border-[#fde047] px-7 py-5 font-display font-bold text-xl text-slate-700 hover:bg-[#fde047]/20 transition-colors"
              style={{ borderRadius: '2rem' }}
            >
              <span className="material-symbols-outlined">login</span>
              Sign In
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 bg-white/60 p-4 rounded-full w-fit backdrop-blur-sm border border-white">
            <div className="flex -space-x-3">
              {['A', 'B', 'C'].map((letter, i) => (
                <div key={i} className="w-11 h-11 rounded-full border-4 border-white bg-sky-200 flex items-center justify-center font-bold text-sky-700">
                  {letter}
                </div>
              ))}
            </div>
            <p className="font-display font-semibold text-slate-500">Thousands of artists are drawing right now!</p>
          </div>
        </div>

        {/* Right: mock canvas */}
        <div className="lg:w-1/2 relative">
          <div className="relative w-full aspect-square max-w-lg mx-auto">
            <div className="absolute inset-0 bg-white rounded-[3rem] shadow-2xl border-8 border-[#38bdf8]/10 rotate-3 overflow-hidden p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#f472b6]" />
                  <div className="w-4 h-4 rounded-full bg-[#fde047]" />
                  <div className="w-4 h-4 rounded-full bg-[#4ade80]" />
                </div>
                <span className="font-display font-bold text-slate-300 text-sm tracking-widest">MAGIC CANVAS</span>
              </div>
              <div className="flex-1 bg-[#f0f9ff] rounded-[2rem] border-4 border-dashed border-[#38bdf8]/30 flex items-center justify-center relative">
                <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-[6rem] text-[#38bdf8]/40 leading-none">face_6</span>
                  <p className="font-display font-bold text-[#38bdf8]/60 text-xl">Drawing Joy…</p>
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-8 bg-white p-4 rounded-3xl shadow-xl border-2 border-slate-50 flex items-center gap-3 -rotate-6">
                  <div className="w-12 h-12 bg-[#f472b6] rounded-2xl flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">heart_plus</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">Sweet Palette</p>
                    <p className="font-display font-bold text-slate-800">Sugar Rush!</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Corner blob */}
            <div
              className="absolute -top-10 -right-8 w-28 h-28 bg-[#fde047] flex items-center justify-center rotate-12 shadow-lg"
              style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
            >
              <span className="material-symbols-outlined text-4xl text-white">celebration</span>
            </div>
          </div>
        </div>
      </section>

      {/* How to Play */}
      <section className="py-24 px-6 lg:px-24 bg-[#38bdf8]/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-5xl md:text-6xl font-black text-slate-900 mb-6">How to Play Artfully</h2>
            <p className="text-xl text-slate-500 font-medium">It's as easy as eating a giant strawberry! 🍓</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                color: '#4ade80', iconBg: 'bg-[#4ade80]/20', icon: 'draw',
                step: '1. Draw!',
                desc: 'Take turns drawing the given word to the best of your artistic ability!',
                rotate: '',
              },
              {
                color: '#fde047', iconBg: 'bg-[#fde047]/20', icon: 'psychology_alt',
                step: '2. Guess!',
                desc: "Type your guesses fast to earn more points while others are drawing!",
                rotate: '-rotate-2',
              },
              {
                color: '#f472b6', iconBg: 'bg-[#f472b6]/20', icon: 'public',
                step: '3. Compete Globally!',
                desc: 'Play in private lobbies with friends or compete with people from all around the world!',
                rotate: 'rotate-2',
              },
            ].map(({ color, iconBg, icon, step, desc, rotate }, i) => (
              <div key={i} className={`group relative ${rotate}`}>
                <div
                  className="bg-white p-10 rounded-[2.5rem] shadow-xl border-b-8 group-hover:-translate-y-4 transition-transform duration-500"
                  style={{ borderBottomColor: color }}
                >
                  <div className={`w-20 h-20 ${iconBg} rounded-2xl flex items-center justify-center mb-8 rotate-3`}>
                    <span className="material-symbols-outlined text-5xl" style={{ color }}>{icon}</span>
                  </div>
                  <h3 className="font-display text-3xl font-bold mb-4">{step}</h3>
                  <p className="text-lg text-slate-600 leading-relaxed">{desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 z-10 scale-150" style={{ color }}>
                    <span className="material-symbols-outlined">trending_flat</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Masterpieces */}
      <section className="py-24 px-6 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <h2 className="font-display text-5xl font-black text-slate-900 mb-4">Today's Masterpieces</h2>
              <p className="text-xl text-slate-500">A garden of fresh doodles picked just for you!</p>
            </div>
            <button
              onClick={() => navigate('/hall-of-fame')}
              className="bg-white border-4 border-[#38bdf8] text-[#38bdf8] px-8 py-4 rounded-full font-display font-bold text-xl hover:bg-[#38bdf8] hover:text-white transition-all shadow-[4px_4px_0_0_#38bdf8]"
            >
              Visit the Wonder Hall
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { bg: 'bg-[#fde047]/20', border: 'border-[#fde047]', textColor: 'text-[#fde047]', icon: 'palette', title: 'Sunny Meadows', author: 'LittleBee', rotate: 'rotate-1', offset: '' },
              { bg: 'bg-[#f472b6]/20', border: 'border-[#f472b6]', textColor: 'text-[#f472b6]', icon: 'cruelty_free', title: 'Pink Bun', author: 'HopAround', rotate: '-rotate-2', offset: 'translate-y-8' },
              { bg: 'bg-[#38bdf8]/20', border: 'border-[#38bdf8]', textColor: 'text-[#38bdf8]', icon: 'cloud', title: 'Cloud Castle', author: 'SkyHigh', rotate: 'rotate-3', offset: '' },
              { bg: 'bg-[#4ade80]/20', border: 'border-[#4ade80]', textColor: 'text-[#4ade80]', icon: 'forest', title: 'Secret Woods', author: 'FernLeaf', rotate: '-rotate-1', offset: 'translate-y-4' },
            ].map(({ bg, border, textColor, icon, title, author, rotate, offset }) => (
              <div
                key={title}
                className={`group relative aspect-[3/4] ${bg} overflow-hidden shadow-lg ${rotate} ${offset} hover:rotate-0 transition-transform cursor-pointer`}
                style={{ borderRadius: '2rem' }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`material-symbols-outlined text-7xl ${textColor}/40`}>{icon}</span>
                </div>
                <div className={`absolute bottom-0 inset-x-0 p-6 bg-white/80 backdrop-blur-sm border-t-2 border-dashed ${border}`}>
                  <p className="font-display font-bold text-lg text-slate-800">{title}</p>
                  <p className={`text-sm font-bold ${textColor}`}>by {author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 lg:px-24">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#38bdf8] via-[#f472b6] to-[#fde047] p-1 rounded-[4rem] shadow-2xl rotate-1">
          <div className="bg-[#fffdf5] rounded-[3.8rem] px-8 py-20 text-center flex flex-col items-center gap-10 -rotate-1">
            <div className="bg-[#fde047]/20 p-6 rounded-full animate-bounce">
              <span className="material-symbols-outlined text-6xl text-[#fde047]">magic_button</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-black text-slate-900 leading-tight">
              Ready to join the ultimate{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-[#4ade80]">social Pictionary game?</span>
            </h2>
            <p className="text-2xl text-slate-600 max-w-2xl font-medium">
              Compete with people around the world, show off your drawing skills, and guess your way to the top!
            </p>
            <button
              onClick={() => navigate('/register')}
              className="bg-[#f472b6] text-white px-12 py-6 rounded-full font-display font-black text-3xl shadow-[0_10px_0_0_#be185d] hover:shadow-[0_4px_0_0_#be185d] hover:translate-y-2 transition-all"
            >
              Let's Goooo! 🚀
            </button>
            <div className="flex gap-4 items-center">
              <span className="material-symbols-outlined text-[#4ade80]">check_circle</span>
              <p className="font-display font-bold text-slate-400 uppercase tracking-widest text-sm">No Downloads • Pure Happiness</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20 px-6 lg:px-24 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <div className="bg-[#38bdf8] p-2 rounded-xl -rotate-12">
                <span className="material-symbols-outlined text-2xl text-white">auto_fix_high</span>
              </div>
              <h2 className="text-3xl font-display font-bold">Artfully</h2>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Spreading creativity and fun one drawing at a time. Join our happy little corner of the internet!
            </p>
          </div>
          <div className="space-y-6">
            <h4 className="font-display text-xl font-bold text-[#38bdf8]">Fun Places</h4>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Start Playing</button></li>
              <li><button onClick={() => navigate('/hall-of-fame')} className="hover:text-white transition-colors">Wonder Hall</button></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-display text-xl font-bold text-[#f472b6]">Account</h4>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Sign In</button></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Create Account</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 font-bold text-sm">
          <p>© {new Date().getFullYear()} Artfully. Created with lots of magic and a few sprinkles.</p>
        </div>
      </footer>

      <AnnouncementModal />
    </div>
  );
}
