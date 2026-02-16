import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DrawingCanvas from '../components/canvas/DrawingCanvas';
import type { DrawingCanvasHandle } from '../components/canvas/DrawingCanvas';
import CanvasToolbar from '../components/canvas/CanvasToolbar';
import ColorPalette from '../components/canvas/ColorPalette';
import BrushSettings from '../components/canvas/BrushSettings';
import ReplayOverlay from '../components/canvas/ReplayOverlay';
import { useCanvasStore } from '../store/canvasStore';
import { useAuthStore } from '../store/authStore';
import { account, storage, BUCKETS, ID } from '../lib/appwrite';

const DRAWING_BUCKET = BUCKETS.AVATARS;
import Button from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import type { Stroke, FillAction } from '@artfully/shared';
import { MAX_SAVED_DRAWINGS } from '@artfully/shared';

export default function PracticePage() {
  const navigate = useNavigate();
  const clear = useCanvasStore((state) => state.clear);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const canvasRef = useRef<DrawingCanvasHandle>(null);

  const [isReplaying, setIsReplaying] = useState(false);
  const replaySnapshotRef = useRef<{ strokes: Stroke[]; fillActions: FillAction[] }>({
    strokes: [],
    fillActions: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Clear canvas when entering practice mode
  useEffect(() => {
    clear();
  }, [clear]);

  // Clear save message after a delay
  useEffect(() => {
    if (!saveMessage) return;
    const timer = setTimeout(() => setSaveMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [saveMessage]);

  const handleReplay = useCallback(() => {
    const { strokes, fillActions } = useCanvasStore.getState();
    replaySnapshotRef.current = {
      strokes: JSON.parse(JSON.stringify(strokes)),
      fillActions: JSON.parse(JSON.stringify(fillActions)),
    };
    setIsReplaying(true);
  }, []);

  const handleSave = useCallback(async () => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Convert data URL to Blob for storage upload
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `drawing_${Date.now()}.png`, { type: 'image/png' });

      // Upload to Appwrite Storage
      const uploaded = await storage.createFile(DRAWING_BUCKET, ID.unique(), file);
      const imageUrl = storage.getFileView(DRAWING_BUCKET, uploaded.$id).toString();

      // Save metadata via server API
      const jwt = await account.createJWT();
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';

      const response = await fetch(`${serverUrl}/api/drawings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt.jwt}`,
        },
        body: JSON.stringify({ imageFileId: uploaded.$id, imageUrl }),
      });

      if (!response.ok) {
        // Clean up uploaded file on API failure
        try { await storage.deleteFile(DRAWING_BUCKET, uploaded.$id); } catch {}
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSaveMessage('Saved to profile!');
    } catch (err: any) {
      setSaveMessage(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Practice Room</h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[1fr_250px] gap-6">
          {/* Canvas Area */}
          <div className="space-y-4">
            <div className="relative">
              <CanvasToolbar
                onReplay={handleReplay}
                onSave={isAuthenticated ? handleSave : undefined}
                isSaving={isSaving}
              />
              {saveMessage && (
                <div className={`absolute top-full mt-2 right-0 px-3 py-1.5 rounded-lg text-sm font-medium z-10 ${
                  saveMessage.includes('Saved') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {saveMessage}
                </div>
              )}
            </div>
            <DrawingCanvas ref={canvasRef} isDrawer={true} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <ColorPalette />
            <BrushSettings />
            {!isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                <p className="font-medium">Log in to save drawings</p>
                <p className="mt-1 text-yellow-600">
                  You can save up to {MAX_SAVED_DRAWINGS} drawings to your profile.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isReplaying && (
        <ReplayOverlay
          strokes={replaySnapshotRef.current.strokes}
          fillActions={replaySnapshotRef.current.fillActions}
          onClose={() => setIsReplaying(false)}
        />
      )}
    </div>
  );
}
