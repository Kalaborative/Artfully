import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useShopStore } from '../store/shopStore';
import { Palette, Settings, Coins } from 'lucide-react';
import NotificationBell from './ui/NotificationBell';

export default function Layout() {
  const { isAuthenticated, profile, statistics, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const initTheme = useThemeStore((s) => s.initTheme);
  const { purchasedItems, fetchPurchases } = useShopStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPurchases();
    }
  }, [isAuthenticated, fetchPurchases]);

  useEffect(() => {
    initTheme();
  }, [profile?.activeTheme, purchasedItems, initTheme]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on navigation
  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

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
                    <Link
                      to="/shop"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors font-semibold text-sm"
                      title="Coins"
                    >
                      <Coins className="w-4 h-4" />
                      <span>{statistics?.coins ?? 0}</span>
                    </Link>
                    <NotificationBell />
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="p-2 rounded-xl bg-primary-50 text-primary-500 hover:bg-primary-100 transition-colors"
                        title="Settings"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                      {showDropdown && (
                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                          <Link
                            to="/settings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Log Out
                          </button>
                        </div>
                      )}
                    </div>
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
