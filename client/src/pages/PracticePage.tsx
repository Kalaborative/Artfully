import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DrawingCanvas from '../components/canvas/DrawingCanvas';
import CanvasToolbar from '../components/canvas/CanvasToolbar';
import ColorPalette from '../components/canvas/ColorPalette';
import BrushSettings from '../components/canvas/BrushSettings';
import { useCanvasStore } from '../store/canvasStore';
import Button from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function PracticePage() {
  const navigate = useNavigate();
  const clear = useCanvasStore((state) => state.clear);

  // Clear canvas when entering practice mode
  useEffect(() => {
    clear();
  }, [clear]);

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
            <CanvasToolbar />
            <DrawingCanvas isDrawer={true} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <ColorPalette />
            <BrushSettings />
          </div>
        </div>
      </div>
    </div>
  );
}
