import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Palette, User, LogOut } from 'lucide-react';
import NotificationBell from './ui/NotificationBell';

export default function Layout() {
  const { isAuthenticated, user, profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {!(location.pathname === '/' && !isAuthenticated) && (
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2 text-primary-500 hover:text-primary-600">
                <Palette className="w-8 h-8" />
                <span className="text-xl font-bold tracking-tight">Artfully</span>
              </Link>

              <nav className="flex items-center gap-4">
                {isAuthenticated ? (
                  <>
                    <NotificationBell />
                    <Link
                      to="/profile"
                      className="p-2 rounded-xl bg-primary-50 text-primary-500 hover:bg-primary-100 transition-colors"
                      title={profile?.displayName || user?.name || 'Profile'}
                    >
                      <User className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
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
      )}

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
