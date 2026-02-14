import { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { DEFAULT_COLORS } from '@artfully/shared';
import { Plus, Check } from 'lucide-react';

export default function ColorPalette() {
  const { color, setColor, customColors, addCustomColor } = useCanvasStore();
  const [showPicker, setShowPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');

  const handleAddCustomColor = () => {
    addCustomColor(customColor);
    setColor(customColor);
    setShowPicker(false);
  };

  return (
    <div className="p-3 bg-white rounded-lg shadow">
      <div className="grid grid-cols-10 gap-1">
        {DEFAULT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`
              w-6 h-6 rounded border-2 transition-all
              ${color === c ? 'border-primary-500 scale-110' : 'border-gray-200'}
            `}
            style={{ backgroundColor: c }}
            title={c}
          >
            {color === c && (
              <Check className={`w-4 h-4 mx-auto ${c === '#FFFFFF' ? 'text-gray-800' : 'text-white'}`} />
            )}
          </button>
        ))}
      </div>

      {customColors.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-10 gap-1">
            {customColors.map((c, i) => (
              <button
                key={`custom-${i}`}
                onClick={() => setColor(c)}
                className={`
                  w-6 h-6 rounded border-2 transition-all
                  ${color === c ? 'border-primary-500 scale-110' : 'border-gray-200'}
                `}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-8 h-8 rounded border-2 border-gray-200 flex items-center justify-center hover:border-primary-500 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>

          {showPicker && (
            <div className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-lg shadow-lg z-10">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-24 h-24 cursor-pointer"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setShowPicker(false)}
                  className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomColor}
                  className="px-2 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="w-8 h-8 rounded border-2 border-gray-300"
          style={{ backgroundColor: color }}
          title="Current color"
        />
      </div>
    </div>
  );
}
