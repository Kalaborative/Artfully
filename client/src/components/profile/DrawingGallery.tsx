import { useState } from 'react';
import { Palette, Trash2, X, Play, Star } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { account } from '../../lib/appwrite';
import type { SavedDrawing } from '@artfully/shared';
import { MAX_SAVED_DRAWINGS } from '@artfully/shared';
import Card from '../ui/Card';
import ReplayOverlay from '../canvas/ReplayOverlay';

interface DrawingGalleryProps {
  drawings: SavedDrawing[];
  isOwner: boolean;
  onDelete?: (id: string) => Promise<void>;
  artistName?: string;
}

export default function DrawingGallery({ drawings, isOwner, onDelete, artistName }: DrawingGalleryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replayData, setReplayData] = useState<{ strokes: any[]; fillActions: any[] } | null>(null);
  const [loadingReplayId, setLoadingReplayId] = useState<string | null>(null);
  const [addingToHallId, setAddingToHallId] = useState<string | null>(null);
  const [hallStatus, setHallStatus] = useState<{ id: string; success: boolean } | null>(null);

  const { user, profile } = useAuthStore();
  const ADMIN_IDS = (import.meta.env.VITE_ADMIN_USER_IDS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const isAdmin = user && ADMIN_IDS.includes(user.$id);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReplay = async (drawing: SavedDrawing) => {
    if (!drawing.replayData) return;
    setLoadingReplayId(drawing.id);
    try {
      // Decode base64 replay data
      const decodedJson = atob(drawing.replayData);
      const data = JSON.parse(decodedJson);
      setReplayData({ strokes: data.strokes, fillActions: data.fillActions });
    } catch (err) {
      console.error('Failed to load replay:', err);
    } finally {
      setLoadingReplayId(null);
    }
  };

  const handleAddToHallOfFame = async (drawing: SavedDrawing) => {
    setAddingToHallId(drawing.id);
    setHallStatus(null);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const jwt = await account.createJWT();

      const res = await fetch(`${serverUrl}/api/hall-of-fame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt.jwt}`,
        },
        body: JSON.stringify({
          originalDrawingId: drawing.id,
          userId: drawing.userId,
          artistName: artistName || profile?.displayName || user?.name || 'Unknown Artist',
          imageFileId: drawing.imageFileId,
          imageUrl: drawing.imageUrl,
          replayData: drawing.replayData
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed');
      }

      setHallStatus({ id: drawing.id, success: true });
      setTimeout(() => setHallStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setHallStatus({ id: drawing.id, success: false });
      setTimeout(() => setHallStatus(null), 3000);
    } finally {
      setAddingToHallId(null);
    }
  };

  const expandedDrawing = expandedId ? drawings.find(d => d.id === expandedId) : null;

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Palette className="w-5 h-5 text-purple-500" />
        Gallery
        <span className="text-sm font-normal text-gray-400">
          {drawings.length}/{MAX_SAVED_DRAWINGS}
        </span>
      </h3>

      {drawings.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Palette className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No saved drawings yet</p>
          {isOwner && (
            <p className="text-xs mt-1">
              Use the Practice Room to create and save drawings
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {drawings.map((drawing) => (
            <div
              key={drawing.id}
              className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white"
            >
              <img
                src={drawing.imageUrl}
                alt="Saved drawing"
                className="w-full aspect-[4/3] object-contain cursor-pointer"
                onClick={() => setExpandedId(drawing.id)}
              />

              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white/80">
                  {new Date(drawing.createdAt).toLocaleDateString()}
                </p>
              </div>

              {drawing.replayData && (
                <button
                  onClick={() => handleReplay(drawing)}
                  disabled={loadingReplayId === drawing.id}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-purple-500/80 text-white opacity-0 group-hover:opacity-100 hover:bg-purple-600 transition-all disabled:opacity-50"
                  title="Replay drawing"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}

              {isOwner && onDelete && (
                <button
                  onClick={() => handleDelete(drawing.id)}
                  disabled={deletingId === drawing.id}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all disabled:opacity-50"
                  title="Delete drawing"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => handleAddToHallOfFame(drawing)}
                  disabled={addingToHallId === drawing.id || hallStatus?.id === drawing.id}
                  className={`absolute top-2 right-${isOwner ? '10' : '2'} p-1.5 rounded-full ${hallStatus?.id === drawing.id
                    ? hallStatus.success ? 'bg-green-500/80' : 'bg-red-500/80'
                    : 'bg-yellow-500/80 hover:bg-yellow-600'
                    } text-white opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50`}
                  title="Feature in Wonder Hall"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expanded view modal */}
      {expandedDrawing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setExpandedId(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExpandedId(null)}
              className="absolute -top-3 -right-3 z-10 p-1.5 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={expandedDrawing.imageUrl}
              alt="Saved drawing"
              className="rounded-lg shadow-2xl max-w-[90vw] max-h-[85vh] object-contain bg-white"
            />
          </div>
        </div>
      )}

      {/* Replay overlay */}
      {replayData && (
        <ReplayOverlay
          strokes={replayData.strokes}
          fillActions={replayData.fillActions}
          onClose={() => setReplayData(null)}
        />
      )}
    </Card>
  );
}
