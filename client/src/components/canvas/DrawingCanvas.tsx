import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { CANVAS_CONFIG } from '@artfully/shared';
import type { Point, Stroke, FillAction, ToolType } from '@artfully/shared';
import { renderToBuffer, appendStrokeToBuffer, appendFillToBuffer, compositeFrame } from './drawUtils';

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
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const prevStrokesRef = useRef<Stroke[]>([]);
  const prevFillActionsRef = useRef<FillAction[]>([]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL('image/png') ?? null,
  }));

  const {
    strokes,
    fillActions,
    currentStroke,
    currentTool,
    size,
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

  // Initialize the offscreen buffer canvas
  const getBufferCanvas = useCallback(() => {
    if (!bufferCanvasRef.current) {
      bufferCanvasRef.current = document.createElement('canvas');
      bufferCanvasRef.current.width = width;
      bufferCanvasRef.current.height = height;
      // Initial white fill
      const ctx = bufferCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }
    }
    return bufferCanvasRef.current;
  }, [width, height]);

  // Update buffer when completed strokes/fills change
  useEffect(() => {
    const bufferCanvas = getBufferCanvas();
    const bufferCtx = bufferCanvas.getContext('2d');
    if (!bufferCtx) return;

    const prevStrokes = prevStrokesRef.current;
    const prevFills = prevFillActionsRef.current;

    // Detect if a stroke was appended (most common case: endStroke adds one to the end)
    const strokeAppended = strokes.length === prevStrokes.length + 1 &&
      prevStrokes.every((s, i) => s === strokes[i]) &&
      fillActions === prevFills;

    // Detect if a fill was appended
    const fillAppended = fillActions.length === prevFills.length + 1 &&
      prevFills.every((f, i) => f === fillActions[i]) &&
      strokes === prevStrokes;

    if (strokeAppended) {
      // Just draw the new stroke onto the existing buffer
      appendStrokeToBuffer(bufferCtx, strokes[strokes.length - 1]);
    } else if (fillAppended) {
      // Just draw the new fill onto the existing buffer
      appendFillToBuffer(bufferCtx, fillActions[fillActions.length - 1], width, height);
    } else {
      // Full re-render (undo, redo, clear, remote sync, etc.)
      renderToBuffer(bufferCtx, width, height, strokes, fillActions);
    }

    prevStrokesRef.current = strokes;
    prevFillActionsRef.current = fillActions;
  }, [strokes, fillActions, width, height, getBufferCanvas]);

  // Composite buffer + currentStroke to visible canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferCanvas = getBufferCanvas();
    compositeFrame(ctx, bufferCanvas, currentStroke);
  }, [strokes, fillActions, currentStroke, getBufferCanvas]);

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
    if (isDrawer && currentTool === 'eraser') {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    }

    if (!isDrawer || !isDrawingRef.current) return;

    e.preventDefault();
    const point = getCanvasPoint(e);
    addPoint(point);
  }, [isDrawer, currentTool, getCanvasPoint, addPoint]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDrawer || !isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    isDrawingRef.current = false;
    endStroke();
  }, [isDrawer, endStroke]);

  const handlePointerEnter = useCallback((e: React.PointerEvent) => {
    if (isDrawer && currentTool === 'eraser') {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    }
  }, [isDrawer, currentTool]);

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    setCursorPos(null);
    if (isDrawer && isDrawingRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }
      isDrawingRef.current = false;
      endStroke();
    }
  }, [isDrawer, endStroke]);

  const getCursorClass = (): string => {
    if (!isDrawer) return 'cursor-not-allowed';
    if (currentTool === 'eraser') return 'cursor-none';

    const cursorMap: Record<ToolType, string> = {
      pencil: 'cursor-pencil',
      pen: 'cursor-pencil',
      brush: 'cursor-crosshair',
      neon: 'cursor-crosshair',
      glitter: 'cursor-crosshair',
      eraser: 'cursor-none',
      fill: 'cursor-fill',
    };

    return cursorMap[currentTool] || 'cursor-crosshair';
  };

  // Calculate the eraser circle size in CSS pixels (account for canvas scaling)
  const getEraserDisplaySize = (): number => {
    const canvas = canvasRef.current;
    if (!canvas) return size;
    const rect = canvas.getBoundingClientRect();
    return size * (rect.width / canvas.width);
  };

  const showEraserCursor = isDrawer && currentTool === 'eraser' && cursorPos !== null;

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
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      />
      {!isDrawer && (
        <div className="absolute inset-0 bg-transparent" />
      )}
      {showEraserCursor && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-gray-500"
          style={{
            width: getEraserDisplaySize(),
            height: getEraserDisplaySize(),
            left: cursorPos.x - getEraserDisplaySize() / 2,
            top: cursorPos.y - getEraserDisplaySize() / 2,
          }}
        />
      )}
    </div>
  );
});

export default DrawingCanvas;
