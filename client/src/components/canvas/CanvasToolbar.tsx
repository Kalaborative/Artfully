import { useCanvasStore } from '../../store/canvasStore';
import { useShopStore } from '../../store/shopStore';
import { Pencil, Pen, Paintbrush, Eraser, PaintBucket, Undo2, Redo2, Trash2, Play, Save, Zap, Wand2 } from 'lucide-react';
import type { ToolType } from '@artfully/shared';

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  premium?: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, isActive, premium, onClick }: ToolButtonProps) {
  const glowStyle = premium
    ? {
        boxShadow: isActive
          ? '0 0 10px 2px rgba(168, 85, 247, 0.5), 0 0 20px 4px rgba(168, 85, 247, 0.2)'
          : '0 0 8px 1px rgba(168, 85, 247, 0.3), 0 0 16px 2px rgba(168, 85, 247, 0.1)',
      }
    : undefined;

  return (
    <button
      onClick={onClick}
      title={label}
      style={glowStyle}
      className={`
        p-2 rounded-lg transition-all
        ${isActive
          ? premium
            ? 'bg-purple-500 text-white'
            : 'bg-primary-500 text-white shadow-md'
          : premium
            ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
    >
      {icon}
    </button>
  );
}

interface CanvasToolbarProps {
  onReplay?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  saveLabel?: string;
}

export default function CanvasToolbar({ onReplay, onSave, isSaving, saveLabel }: CanvasToolbarProps) {
  const {
    currentTool,
    setTool,
    undo,
    redo,
    clear,
    strokes,
    fillActions,
    undoStack,
  } = useCanvasStore();

  const { purchasedItems } = useShopStore();

  const hasContent = strokes.length > 0 || fillActions.length > 0;

  const tools: { tool: ToolType; icon: React.ReactNode; label: string; premium?: boolean }[] = [
    { tool: 'pencil', icon: <Pencil className="w-5 h-5" />, label: 'Pencil' },
    { tool: 'pen', icon: <Pen className="w-5 h-5" />, label: 'Pen' },
    { tool: 'brush', icon: <Paintbrush className="w-5 h-5" />, label: 'Brush' },
    ...(purchasedItems.includes('neon-brush')
      ? [{ tool: 'neon' as ToolType, icon: <Zap className="w-5 h-5" />, label: 'Neon Brush', premium: true }]
      : []),
    ...(purchasedItems.includes('glitter-brush')
      ? [{ tool: 'glitter' as ToolType, icon: <Wand2 className="w-5 h-5" />, label: 'Glitter Brush', premium: true }]
      : []),
    { tool: 'eraser', icon: <Eraser className="w-5 h-5" />, label: 'Eraser' },
    { tool: 'fill', icon: <PaintBucket className="w-5 h-5" />, label: 'Fill' },
  ];

  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-lg shadow">
      <div className="flex gap-1">
        {tools.map(({ tool, icon, label, premium }) => (
          <ToolButton
            key={tool}
            tool={tool}
            icon={icon}
            label={label}
            isActive={currentTool === tool}
            premium={premium}
            onClick={() => setTool(tool)}
          />
        ))}
      </div>

      <div className="h-8 w-px bg-gray-200" />

      <div className="flex gap-1">
        <button
          onClick={undo}
          disabled={strokes.length === 0 && fillActions.length === 0}
          title="Undo"
          className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={redo}
          disabled={undoStack.length === 0}
          title="Redo"
          className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Redo2 className="w-5 h-5" />
        </button>
      </div>

      <div className="h-8 w-px bg-gray-200" />

      <button
        onClick={clear}
        title="Clear canvas"
        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {(onReplay || onSave) && (
        <>
          <div className="h-8 w-px bg-gray-200" />

          <div className="flex gap-1">
            {onReplay && (
              <button
                onClick={onReplay}
                disabled={!hasContent}
                title="Replay drawing"
                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Play className="w-5 h-5" />
              </button>
            )}

            {onSave && (
              <button
                onClick={onSave}
                disabled={!hasContent || isSaving}
                title={saveLabel || 'Save to Profile'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : (saveLabel || 'Save to Profile')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
