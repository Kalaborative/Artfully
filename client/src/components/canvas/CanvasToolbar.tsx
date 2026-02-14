import { useCanvasStore } from '../../store/canvasStore';
import { Pencil, Pen, Paintbrush, Eraser, PaintBucket, Undo2, Redo2, Trash2 } from 'lucide-react';
import type { ToolType } from '@artfully/shared';

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        p-2 rounded-lg transition-all
        ${isActive
          ? 'bg-primary-500 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
    >
      {icon}
    </button>
  );
}

export default function CanvasToolbar() {
  const {
    currentTool,
    setTool,
    undo,
    redo,
    clear,
    strokes,
    undoStack,
  } = useCanvasStore();

  const tools: { tool: ToolType; icon: React.ReactNode; label: string }[] = [
    { tool: 'pencil', icon: <Pencil className="w-5 h-5" />, label: 'Pencil' },
    { tool: 'pen', icon: <Pen className="w-5 h-5" />, label: 'Pen' },
    { tool: 'brush', icon: <Paintbrush className="w-5 h-5" />, label: 'Brush' },
    { tool: 'eraser', icon: <Eraser className="w-5 h-5" />, label: 'Eraser' },
    { tool: 'fill', icon: <PaintBucket className="w-5 h-5" />, label: 'Fill' },
  ];

  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-lg shadow">
      <div className="flex gap-1">
        {tools.map(({ tool, icon, label }) => (
          <ToolButton
            key={tool}
            tool={tool}
            icon={icon}
            label={label}
            isActive={currentTool === tool}
            onClick={() => setTool(tool)}
          />
        ))}
      </div>

      <div className="h-8 w-px bg-gray-200" />

      <div className="flex gap-1">
        <button
          onClick={undo}
          disabled={strokes.length === 0}
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
    </div>
  );
}
