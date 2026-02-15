import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useGameStore } from './store/gameStore';
import { useEffect, useRef } from 'react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import PlayerProfilePage from './pages/PlayerProfilePage';
import PracticePage from './pages/PracticePage';
import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { checkSession, isLoading, isAuthenticated } = useAuthStore();
  const { setupListeners: setupGameListeners } = useGameStore();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    // Only check session once on mount
    if (!hasCheckedSession.current) {
      hasCheckedSession.current = true;
      checkSession();
    }
  }, [checkSession]);

  // Setup game listeners at the app level so they persist across page navigation
  useEffect(() => {
    if (isAuthenticated) {
      const unsub = setupGameListeners();
      return unsub;
    }
  }, [isAuthenticated, setupGameListeners]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={isAuthenticated ? <DashboardPage /> : <HomePage />} />
        <Route
          path="login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
        />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="player/:username" element={<PlayerProfilePage />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="lobby/:code?"
          element={
            <ProtectedRoute>
              <LobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="game/:id"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="practice"
          element={
            <ProtectedRoute>
              <PracticePage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
