import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import CreateLobbyModal from '../components/lobby/CreateLobbyModal';
import JoinLobbyModal from '../components/lobby/JoinLobbyModal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Palette, Users, Trophy, Sparkles, Plus, Hash, PenTool } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const handleCreated = (code: string) => {
    setShowCreate(false);
    navigate(`/lobby/${code}`);
  };

  const handleJoined = (code: string) => {
    setShowJoin(false);
    navigate(`/lobby/${code}`);
  };

  return (
    <div className="min-h-[80vh]">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-500 to-primary-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Draw. Guess. Win!</h1>
          <p className="text-xl text-primary-100 mb-8">
            The ultimate multiplayer drawing game. Challenge your friends and show off your artistic skills!
          </p>

          {isAuthenticated ? (
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
          ) : (
            <div className="flex gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/login')}
                className="bg-white/10 border-white text-white hover:bg-white/20"
              >
                Login
              </Button>
            </div>
          )}
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
              <p className="text-gray-600">
                Multiple brushes, colors, and tools to bring your drawings to life.
              </p>
            </Card>

            <Card hover className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Play with Friends</h3>
              <p className="text-gray-600">
                Create private lobbies and invite friends with a simple code.
              </p>
            </Card>

            <Card hover className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Climb the Ranks</h3>
              <p className="text-gray-600">
                Compete globally and see your name on the leaderboard.
              </p>
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
              { step: 2, title: 'Take Turns Drawing', desc: 'When it\'s your turn, draw the word you\'re given' },
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

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Sparkles className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
            <p className="text-gray-600 mb-8">
              Join thousands of players and start drawing today!
            </p>
            <Button size="lg" onClick={() => navigate('/register')}>
              Create Free Account
            </Button>
          </div>
        </section>
      )}

      {/* Modals */}
      <CreateLobbyModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      <JoinLobbyModal
        isOpen={showJoin}
        onClose={() => setShowJoin(false)}
        onJoined={handleJoined}
      />
    </div>
  );
}
