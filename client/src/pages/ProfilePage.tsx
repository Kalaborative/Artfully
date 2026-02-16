import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { databases, DATABASE_ID, COLLECTIONS, ID, account } from '../lib/appwrite';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AvatarUploader from '../components/profile/AvatarUploader';
import CountrySelector, { CountryFlag } from '../components/profile/CountrySelector';
import DrawingGallery from '../components/profile/DrawingGallery';
import { User, Trophy, Target, Award, Edit2, Save, X, AlertCircle } from 'lucide-react';
import type { SavedDrawing } from '@artfully/shared';

export default function ProfilePage() {
  const { user, profile, statistics, updateProfile, refreshProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [countryCode, setCountryCode] = useState(profile?.countryCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<SavedDrawing[]>([]);

  const fetchDrawings = useCallback(async () => {
    try {
      const jwt = await account.createJWT();
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const res = await fetch(`${serverUrl}/api/drawings`, {
        headers: { 'Authorization': `Bearer ${jwt.jwt}` },
      });
      if (res.ok) {
        setDrawings(await res.json());
      }
    } catch {
      // Silently fail - gallery just won't show
    }
  }, []);

  const handleDeleteDrawing = useCallback(async (id: string) => {
    const jwt = await account.createJWT();
    const serverUrl = import.meta.env.VITE_SERVER_URL || '';
    const res = await fetch(`${serverUrl}/api/drawings/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt.jwt}` },
    });
    if (res.ok) {
      setDrawings(prev => prev.filter(d => d.id !== id));
    }
  }, []);

  useEffect(() => {
    if (profile) {
      fetchDrawings();
    }
  }, [profile, fetchDrawings]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await updateProfile({ displayName, countryCode: countryCode || undefined });
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!user) return;

    setIsCreatingProfile(true);
    setError(null);

    try {
      // Create profile
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        ID.unique(),
        {
          userId: user.$id,
          username: user.name || user.email.split('@')[0],
          displayName: user.name || user.email.split('@')[0],
          isOnline: true,
          createdAt: new Date().toISOString()
        }
      );

      // Create statistics
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_STATISTICS,
        ID.unique(),
        {
          userId: user.$id,
          gamesPlayed: 0,
          gamesWon: 0,
          totalPoints: 0
        }
      );

      // Refresh to get the new profile
      await refreshProfile();
    } catch (err: any) {
      console.error('Failed to create profile:', err);
      setError(err.message || 'Failed to create profile. Make sure the Appwrite database is set up correctly.');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setCountryCode(profile.countryCode || '');
    }
  }, [profile]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Not logged in</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-gray-500 mb-6">
            Your profile hasn't been created yet. This can happen if the database wasn't set up when you registered.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-left">
              <strong>Error:</strong> {error}
              <p className="mt-2 text-xs">
                Make sure you've created the "profiles" and "user_statistics" collections in your Appwrite database with the correct attributes and permissions.
              </p>
            </div>
          )}

          <Button
            onClick={handleCreateProfile}
            isLoading={isCreatingProfile}
          >
            Create Profile
          </Button>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left text-sm text-gray-600">
            <p className="font-medium mb-2">Logged in as:</p>
            <p>Email: {user.email}</p>
            <p>Name: {user.name || 'Not set'}</p>
            <p>ID: {user.$id}</p>
          </div>
        </Card>
      </div>
    );
  }

  const winRate = statistics && statistics.gamesPlayed > 0
    ? ((statistics.gamesWon / statistics.gamesPlayed) * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <div className="text-center">
            <AvatarUploader
              currentAvatarUrl={profile.avatarUrl}
              currentFileId={profile.avatarFileId}
              onUpload={async (fileId, fileUrl) => {
                await updateProfile({
                  avatarFileId: fileId,
                  avatarUrl: fileUrl
                });
              }}
              size="xl"
            />

            {isEditing ? (
              <div className="space-y-3 mt-4">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                />
                <CountrySelector
                  value={countryCode}
                  onChange={setCountryCode}
                />
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setError(null);
                      setDisplayName(profile?.displayName || '');
                      setCountryCode(profile?.countryCode || '');
                    }}
                    leftIcon={<X className="w-4 h-4" />}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    isLoading={isLoading}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mt-4 flex items-center justify-center gap-2">
                  {profile.countryCode && (
                    <CountryFlag code={profile.countryCode} size={24} />
                  )}
                  {profile.displayName}
                </h2>
                <p className="text-gray-500">@{profile.username}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => setIsEditing(true)}
                  leftIcon={<Edit2 className="w-4 h-4" />}
                >
                  Edit Profile
                </Button>
              </>
            )}
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
      <div className="mt-6">
        <DrawingGallery
          drawings={drawings}
          isOwner={true}
          onDelete={handleDeleteDrawing}
        />
      </div>
    </div>
  );
}

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

