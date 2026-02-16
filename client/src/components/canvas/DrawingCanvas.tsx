import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { CANVAS_CONFIG } from '@artfully/shared';
import type { Point, ToolType } from '@artfully/shared';
import { redrawCanvas } from './drawUtils';

interface DrawingCanvasProps {
  isDrawer: boolean;
  width?: number;
  height?: number;
}

export interface DrawingCanvasHandle {
  toDataURL: () => string | null;
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(function DrawingCanvas({
  isDrawer,
  width = CANVAS_CONFIG.WIDTH,
  height = CANVAS_CONFIG.HEIGHT,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL('image/png') ?? null,
  }));

  const {
    strokes,
    fillActions,
    currentStroke,
    currentTool,
    startStroke,
    addPoint,
    endStroke,
    fill,
  } = useCanvasStore();

  const getCanvasPoint = useCallback((e: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 0.5,
    };
  }, []);

  const doRedraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    redrawCanvas(ctx, canvas.width, canvas.height, strokes, fillActions, currentStroke);
  }, [strokes, fillActions, currentStroke]);

  useEffect(() => {
    doRedraw();
  }, [doRedraw]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isDrawer) return;

    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setPointerCapture(e.pointerId);
    }

    const point = getCanvasPoint(e);

    if (currentTool === 'fill') {
      fill(point);
      return;
    }

    isDrawingRef.current = true;
    startStroke(point);
  }, [isDrawer, currentTool, getCanvasPoint, startStroke, fill]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawer || !isDrawingRef.current) return;

    e.preventDefault();
    const point = getCanvasPoint(e);
    addPoint(point);
  }, [isDrawer, getCanvasPoint, addPoint]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDrawer || !isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    isDrawingRef.current = false;
    endStroke();
  }, [isDrawer, endStroke]);

  const getCursorClass = (): string => {
    if (!isDrawer) return 'cursor-not-allowed';

    const cursorMap: Record<ToolType, string> = {
      pencil: 'cursor-pencil',
      pen: 'cursor-pencil',
      brush: 'cursor-crosshair',
      eraser: 'cursor-eraser',
      fill: 'cursor-fill',
    };

    return cursorMap[currentTool] || 'cursor-crosshair';
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ aspectRatio: `${width}/${height}` }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`w-full h-full touch-none ${getCursorClass()}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {!isDrawer && (
        <div className="absolute inset-0 bg-transparent" />
      )}
    </div>
  );
});

export default DrawingCanvas;
