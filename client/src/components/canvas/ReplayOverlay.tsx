import { useRef, useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { CANVAS_CONFIG } from '@artfully/shared';
import type { Stroke, FillAction } from '@artfully/shared';
import { drawStroke, floodFillCanvas } from './drawUtils';

interface ReplayOverlayProps {
  strokes: Stroke[];
  fillActions: FillAction[];
  onClose: () => void;
  speedMultiplier?: number;
}

type TimelineEntry =
  | { type: 'stroke'; stroke: Stroke; timestamp: number }
  | { type: 'fill'; fill: FillAction; timestamp: number };

export default function ReplayOverlay({
  strokes,
  fillActions,
  onClose,
  speedMultiplier = 8,
}: ReplayOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const buildTimeline = useCallback((): {
    timeline: TimelineEntry[];
    firstTimestamp: number;
    lastTimestamp: number;
  } => {
    const timeline: TimelineEntry[] = [];

    for (const stroke of strokes) {
      timeline.push({ type: 'stroke', stroke, timestamp: stroke.timestamp });
    }
    for (const fill of fillActions) {
      timeline.push({ type: 'fill', fill, timestamp: fill.timestamp });
    }

    timeline.sort((a, b) => a.timestamp - b.timestamp);

    if (timeline.length === 0) {
      return { timeline, firstTimestamp: 0, lastTimestamp: 0 };
    }

    const firstTimestamp = timeline[0].timestamp;

    // Last timestamp is the latest point timestamp across all strokes, or last fill timestamp
    let lastTimestamp = timeline[timeline.length - 1].timestamp;
    for (const stroke of strokes) {
      for (const point of stroke.points) {
        if (point.timestamp && point.timestamp > lastTimestamp) {
          lastTimestamp = point.timestamp;
        }
      }
    }

    return { timeline, firstTimestamp, lastTimestamp };
  }, [strokes, fillActions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { timeline, firstTimestamp, lastTimestamp } = buildTimeline();

    if (timeline.length === 0) {
      setDone(true);
      return;
    }

    const totalDuration = lastTimestamp - firstTimestamp;
    if (totalDuration <= 0) {
      // Everything happened at the same instant, just draw it all
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const entry of timeline) {
        if (entry.type === 'stroke') {
          drawStroke(ctx, entry.stroke);
        } else {
          floodFillCanvas(ctx, entry.fill.point.x, entry.fill.point.y, entry.fill.color, canvas.width, canvas.height);
        }
      }
      setProgress(1);
      setDone(true);
      return;
    }

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const realElapsed = now - startTimeRef.current;
      const drawingElapsed = realElapsed * speedMultiplier;
      const currentDrawingTime = firstTimestamp + drawingElapsed;

      // Clear and redraw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const entry of timeline) {
        if (entry.type === 'fill') {
          if (entry.fill.timestamp <= currentDrawingTime) {
            floodFillCanvas(ctx, entry.fill.point.x, entry.fill.point.y, entry.fill.color, canvas.width, canvas.height);
          }
        } else {
          const stroke = entry.stroke;
          // Filter points that have been "drawn" so far
          const visiblePoints = stroke.points.filter(p => {
            const pt = p.timestamp ?? stroke.timestamp;
            return pt <= currentDrawingTime;
          });

          if (visiblePoints.length > 0) {
            const partialStroke: Stroke = {
              ...stroke,
              points: visiblePoints,
            };
            drawStroke(ctx, partialStroke);
          }
        }
      }

      const pct = Math.min(drawingElapsed / totalDuration, 1);
      setProgress(pct);

      if (pct >= 1) {
        setDone(true);
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [buildTimeline, speedMultiplier]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-800/70 text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Replay label */}
        <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-gray-800/70 text-white text-sm font-medium">
          Replay {speedMultiplier}x
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_CONFIG.WIDTH}
          height={CANVAS_CONFIG.HEIGHT}
          className="block"
          style={{ maxWidth: '90vw', maxHeight: '80vh' }}
        />

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200">
          <div
            className="h-full bg-primary-500 transition-[width] duration-75"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Done indicator */}
        {done && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-gray-800/70 text-white text-sm font-medium">
            Replay complete
          </div>
        )}
      </div>
    </div>
  );
}
