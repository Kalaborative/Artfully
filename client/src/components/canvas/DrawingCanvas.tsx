import { useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { CANVAS_CONFIG } from '@artfully/shared';
import type { Point, Stroke, ToolType, FillAction } from '@artfully/shared';

// Convert hex color to RGBA
function hexToRgba(hex: string): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
      255
    ];
  }
  return [0, 0, 0, 255];
}

// Check if two colors match within tolerance
function colorsMatch(
  data: Uint8ClampedArray,
  idx: number,
  targetR: number,
  targetG: number,
  targetB: number,
  targetA: number,
  tolerance: number
): boolean {
  return (
    Math.abs(data[idx] - targetR) <= tolerance &&
    Math.abs(data[idx + 1] - targetG) <= tolerance &&
    Math.abs(data[idx + 2] - targetB) <= tolerance &&
    Math.abs(data[idx + 3] - targetA) <= tolerance
  );
}

// Flood fill algorithm with tolerance for anti-aliased edges
function floodFillCanvas(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: string,
  canvasWidth: number,
  canvasHeight: number
): void {
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  const x = Math.floor(startX);
  const y = Math.floor(startY);

  if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return;

  const startIdx = (y * canvasWidth + x) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  const [fillR, fillG, fillB, fillA] = hexToRgba(fillColor);

  // Don't fill if clicking on the same color
  if (
    Math.abs(targetR - fillR) <= 1 &&
    Math.abs(targetG - fillG) <= 1 &&
    Math.abs(targetB - fillB) <= 1 &&
    Math.abs(targetA - fillA) <= 1
  ) {
    return;
  }

  // Higher tolerance to catch anti-aliased edge pixels
  const tolerance = 64;

  const stack: [number, number][] = [[x, y]];
  const filled = new Set<number>();

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;

    if (cx < 0 || cx >= canvasWidth || cy < 0 || cy >= canvasHeight) continue;

    const idx = (cy * canvasWidth + cx) * 4;
    const key = cy * canvasWidth + cx;

    if (filled.has(key)) continue;
    if (!colorsMatch(data, idx, targetR, targetG, targetB, targetA, tolerance)) continue;

    filled.add(key);

    // Fill the pixel
    data[idx] = fillR;
    data[idx + 1] = fillG;
    data[idx + 2] = fillB;
    data[idx + 3] = fillA;

    // Add neighboring pixels (4-directional)
    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }

  // Second pass: fill any remaining specks that are surrounded by filled pixels
  // This catches anti-aliased edge pixels that weren't quite within tolerance
  for (const key of filled) {
    const cy = Math.floor(key / canvasWidth);
    const cx = key % canvasWidth;

    // Check 8 neighbors for unfilled pixels that should be filled
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = cx + dx;
        const ny = cy + dy;

        if (nx < 0 || nx >= canvasWidth || ny < 0 || ny >= canvasHeight) continue;

        const nKey = ny * canvasWidth + nx;
        if (filled.has(nKey)) continue;

        const nIdx = nKey * 4;

        // Check if this pixel is close to the target color (anti-aliased edge)
        // Use a more lenient tolerance for edge cleanup
        if (colorsMatch(data, nIdx, targetR, targetG, targetB, targetA, 128)) {
          data[nIdx] = fillR;
          data[nIdx + 1] = fillG;
          data[nIdx + 2] = fillB;
          data[nIdx + 3] = fillA;
          filled.add(nKey);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

interface DrawingCanvasProps {
  isDrawer: boolean;
  width?: number;
  height?: number;
}

export default function DrawingCanvas({
  isDrawer,
  width = CANVAS_CONFIG.WIDTH,
  height = CANVAS_CONFIG.HEIGHT,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);

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

  // Calculate stroke width based on velocity for pen tool
  const getVelocityWidth = useCallback((velocity: number, baseSize: number): number => {
    // Velocity is in pixels per millisecond
    // Map velocity to width: faster = thinner, slower = thicker
    const minWidth = baseSize * 0.3;
    const maxWidth = baseSize * 1.5;

    // Normalize velocity (typical range: 0 to ~2 px/ms)
    const normalizedVelocity = Math.min(velocity / 1.5, 1);

    // Inverse relationship: higher velocity = smaller width
    const width = maxWidth - (normalizedVelocity * (maxWidth - minWidth));

    return Math.max(minWidth, Math.min(maxWidth, width));
  }, []);

  // Draw a variable-width stroke segment using quadratic bezier curves
  const drawPenStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const points = stroke.points;
    if (points.length < 2) return;

    ctx.save();
    ctx.globalAlpha = stroke.style.opacity;
    ctx.fillStyle = stroke.style.color;

    if (stroke.style.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    const baseSize = stroke.style.size;

    // For very short strokes, just draw circles at each point
    if (points.length === 2) {
      const p0 = points[0];
      const p1 = points[1];
      const w0 = getVelocityWidth(p0.velocity ?? 0, baseSize);
      const w1 = getVelocityWidth(p1.velocity ?? 0, baseSize);

      // Draw circles at start and end
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, w0 / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, w1 / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw connecting quad
      const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const perpAngle = angle + Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(p0.x + Math.cos(perpAngle) * w0 / 2, p0.y + Math.sin(perpAngle) * w0 / 2);
      ctx.lineTo(p1.x + Math.cos(perpAngle) * w1 / 2, p1.y + Math.sin(perpAngle) * w1 / 2);
      ctx.lineTo(p1.x - Math.cos(perpAngle) * w1 / 2, p1.y - Math.sin(perpAngle) * w1 / 2);
      ctx.lineTo(p0.x - Math.cos(perpAngle) * w0 / 2, p0.y - Math.sin(perpAngle) * w0 / 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      return;
    }

    // Calculate smoothed widths for each point
    const widths: number[] = points.map(p => getVelocityWidth(p.velocity ?? 0, baseSize));

    // Smooth the widths to avoid jarring transitions
    const smoothedWidths: number[] = [];
    for (let i = 0; i < widths.length; i++) {
      if (i === 0) {
        smoothedWidths.push((widths[0] + widths[1]) / 2);
      } else if (i === widths.length - 1) {
        smoothedWidths.push((widths[i - 1] + widths[i]) / 2);
      } else {
        smoothedWidths.push((widths[i - 1] + widths[i] + widths[i + 1]) / 3);
      }
    }

    // Draw circle at start
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, smoothedWidths[0] / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw variable-width stroke using filled quads along the curve
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const w0 = smoothedWidths[i];
      const w1 = smoothedWidths[i + 1];

      // Calculate perpendicular angle for this segment
      const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const perpAngle = angle + Math.PI / 2;

      // Calculate corner points
      const p0Left = { x: p0.x + Math.cos(perpAngle) * w0 / 2, y: p0.y + Math.sin(perpAngle) * w0 / 2 };
      const p0Right = { x: p0.x - Math.cos(perpAngle) * w0 / 2, y: p0.y - Math.sin(perpAngle) * w0 / 2 };
      const p1Left = { x: p1.x + Math.cos(perpAngle) * w1 / 2, y: p1.y + Math.sin(perpAngle) * w1 / 2 };
      const p1Right = { x: p1.x - Math.cos(perpAngle) * w1 / 2, y: p1.y - Math.sin(perpAngle) * w1 / 2 };

      // Use quadratic bezier for smooth edges if we have a next point
      if (i < points.length - 2) {
        const p2 = points[i + 2];
        const nextAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const avgAngle = (angle + nextAngle) / 2;
        const avgPerpAngle = avgAngle + Math.PI / 2;

        // Adjust p1 corners to average angle for smoother joins
        const p1LeftSmooth = { x: p1.x + Math.cos(avgPerpAngle) * w1 / 2, y: p1.y + Math.sin(avgPerpAngle) * w1 / 2 };
        const p1RightSmooth = { x: p1.x - Math.cos(avgPerpAngle) * w1 / 2, y: p1.y - Math.sin(avgPerpAngle) * w1 / 2 };

        // Draw quad with bezier control points
        ctx.beginPath();
        ctx.moveTo(p0Left.x, p0Left.y);
        ctx.quadraticCurveTo(p1Left.x, p1Left.y, p1LeftSmooth.x, p1LeftSmooth.y);
        ctx.lineTo(p1RightSmooth.x, p1RightSmooth.y);
        ctx.quadraticCurveTo(p1Right.x, p1Right.y, p0Right.x, p0Right.y);
        ctx.closePath();
        ctx.fill();
      } else {
        // Last segment - simple quad
        ctx.beginPath();
        ctx.moveTo(p0Left.x, p0Left.y);
        ctx.lineTo(p1Left.x, p1Left.y);
        ctx.lineTo(p1Right.x, p1Right.y);
        ctx.lineTo(p0Right.x, p0Right.y);
        ctx.closePath();
        ctx.fill();
      }

      // Draw circle at each joint for smooth connections
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, w1 / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [getVelocityWidth]);

  // Standard stroke drawing for pencil, eraser
  const drawStandardStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.save();
    ctx.globalAlpha = stroke.style.opacity;
    ctx.strokeStyle = stroke.style.color;
    ctx.lineWidth = stroke.style.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.style.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length - 1; i++) {
      const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
    }

    const lastPoint = stroke.points[stroke.points.length - 1];
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.stroke();
    ctx.restore();
  }, []);

  // Cache for brush stamp images (keyed by size and color)
  const brushCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Create or get cached brush stamp
  const getBrushStamp = useCallback((size: number, color: string): HTMLCanvasElement => {
    const key = `${size}-${color}`;
    const cache = brushCacheRef.current;

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    // Create new brush stamp
    const radius = size / 2;
    const stampSize = Math.ceil(size) + 2;
    const stamp = document.createElement('canvas');
    stamp.width = stampSize;
    stamp.height = stampSize;

    const stampCtx = stamp.getContext('2d')!;
    const center = stampSize / 2;

    // Parse hex color
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    const r = result ? parseInt(result[1], 16) : 0;
    const g = result ? parseInt(result[2], 16) : 0;
    const b = result ? parseInt(result[3], 16) : 0;

    // Create gradient for soft edges
    const gradient = stampCtx.createRadialGradient(center, center, 0, center, center, radius);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.6)`);
    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.3)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    stampCtx.fillStyle = gradient;
    stampCtx.beginPath();
    stampCtx.arc(center, center, radius, 0, Math.PI * 2);
    stampCtx.fill();

    // Limit cache size to prevent memory issues
    if (cache.size > 50) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }

    cache.set(key, stamp);
    return stamp;
  }, []);

  // Brush tool - soft edges using cached stamp with interpolated points
  const drawBrushStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const points = stroke.points;
    if (points.length < 1) return;

    ctx.save();
    ctx.globalAlpha = stroke.style.opacity;

    const size = stroke.style.size;
    const radius = size / 2;
    const stamp = getBrushStamp(size, stroke.style.color);
    const offset = stamp.width / 2;

    // Spacing between brush dabs
    const spacing = radius * 0.3;

    // Draw stamp at a given position
    const drawDab = (x: number, y: number) => {
      ctx.drawImage(stamp, x - offset, y - offset);
    };

    // Draw first point
    drawDab(points[0].x, points[0].y);

    // Interpolate between points to ensure consistent spacing
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];

      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < spacing) {
        drawDab(p1.x, p1.y);
      } else {
        const steps = Math.ceil(dist / spacing);
        for (let j = 1; j <= steps; j++) {
          const t = j / steps;
          const x = p0.x + dx * t;
          const y = p0.y + dy * t;
          drawDab(x, y);
        }
      }
    }

    ctx.restore();
  }, [getBrushStamp]);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;

    // Use velocity-based rendering for pen tool
    if (stroke.style.tool === 'pen') {
      if (stroke.points.length < 2) return;
      drawPenStroke(ctx, stroke);
    } else if (stroke.style.tool === 'brush') {
      drawBrushStroke(ctx, stroke);
    } else {
      if (stroke.points.length < 2) return;
      drawStandardStroke(ctx, stroke);
    }
  }, [drawPenStroke, drawBrushStroke, drawStandardStroke]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Combine strokes and fills, sort by timestamp
    type CanvasAction = (Stroke & { actionType: 'stroke' }) | (FillAction & { actionType: 'fill' });
    const actions: CanvasAction[] = [
      ...strokes.map(s => ({ ...s, actionType: 'stroke' as const })),
      ...fillActions.map(f => ({ ...f, actionType: 'fill' as const }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    for (const action of actions) {
      if (action.actionType === 'stroke') {
        drawStroke(ctx, action);
      } else {
        floodFillCanvas(ctx, action.point.x, action.point.y, action.color, canvas.width, canvas.height);
      }
    }

    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }
  }, [strokes, fillActions, currentStroke, drawStroke]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

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
}
