import { useCanvasStore } from '../../store/canvasStore';
import { CANVAS_CONFIG } from '@artfully/shared';

export default function BrushSettings() {
  const { size, opacity, setSize, setOpacity, currentTool } = useCanvasStore();

  return (
    <div className="p-3 bg-white rounded-lg shadow space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Size</label>
          <span className="text-sm text-gray-500">{size}px</span>
        </div>
        <input
          type="range"
          min={CANVAS_CONFIG.MIN_BRUSH_SIZE}
          max={CANVAS_CONFIG.MAX_BRUSH_SIZE}
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
        />
        <div className="flex justify-center mt-2">
          <div
            className="rounded-full bg-gray-800"
            style={{ width: size, height: size }}
          />
        </div>
      </div>

      {currentTool !== 'eraser' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Opacity</label>
            <span className="text-sm text-gray-500">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={opacity * 100}
            onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>
      )}
    </div>
  );
}
