import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Palette, User, LogOut, Trophy, Home } from 'lucide-react';

export default function Layout() {
  const { isAuthenticated, user, profile, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-primary-500 hover:text-primary-600">
              <Palette className="w-8 h-8" />
              <span className="text-xl font-bold tracking-tight">Artfully</span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Trophy className="w-5 h-5" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">{profile?.displayName || user?.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white border-t mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Artfully. Draw, Guess, Have Fun!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
