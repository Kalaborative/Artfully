import { useState } from 'react';
import { Palette, Trash2, X } from 'lucide-react';
import type { SavedDrawing } from '@artfully/shared';
import { MAX_SAVED_DRAWINGS } from '@artfully/shared';
import Card from '../ui/Card';

interface DrawingGalleryProps {
  drawings: SavedDrawing[];
  isOwner: boolean;
  onDelete?: (id: string) => Promise<void>;
}

export default function DrawingGallery({ drawings, isOwner, onDelete }: DrawingGalleryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
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
    </Card>
  );
}
