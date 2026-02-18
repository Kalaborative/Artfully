import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import type {
  ToolType,
  Stroke,
  Point,
  StrokeStyle,
  FillAction
} from '@artfully/shared';
import { DEFAULT_COLORS, TOOL_DEFAULTS } from '@artfully/shared';

export type CanvasAction = Stroke | FillAction;

interface CanvasStoreState {
  // Tool settings
  currentTool: ToolType;
  color: string;
  size: number;
  opacity: number;
  customColors: string[];

  // Stroke state
  strokes: Stroke[];
  currentStroke: Stroke | null;
  undoStack: CanvasAction[];
  isDrawing: boolean;

  // Fill actions
  fillActions: FillAction[];

  // Actions
  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  addCustomColor: (color: string) => void;

  startStroke: (point: Point) => void;
  addPoint: (point: Point) => void;
  endStroke: () => void;
  fill: (point: Point) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;

  // Remote events
  addRemoteStroke: (stroke: Stroke) => void;
  handleRemoteStrokeStart: (strokeId: string, point: Point, style: StrokeStyle) => void;
  handleRemoteStrokeData: (strokeId: string, points: Point[]) => void;
  handleRemoteStrokeEnd: (strokeId: string) => void;
  handleRemoteFill: (point: Point, color: string, fillId?: string) => void;
  handleRemoteClear: () => void;
  handleRemoteUndo: (actionId: string) => void;

  setupListeners: () => () => void;
  reset: () => void;
}

function generateStrokeId(): string {
  return `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateFillId(): string {
  return `fill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  currentTool: 'pencil',
  color: DEFAULT_COLORS[0],
  size: TOOL_DEFAULTS.pencil.size!,
  opacity: TOOL_DEFAULTS.pencil.opacity!,
  customColors: [],

  strokes: [],
  currentStroke: null,
  undoStack: [],
  isDrawing: false,
  fillActions: [],

  setTool: (tool: ToolType) => {
    const defaults = TOOL_DEFAULTS[tool];
    set({
      currentTool: tool,
      size: defaults.size ?? get().size,
      opacity: defaults.opacity ?? get().opacity
    });
  },

  setColor: (color: string) => set({ color }),
  setSize: (size: number) => set({ size }),
  setOpacity: (opacity: number) => set({ opacity }),

  addCustomColor: (color: string) => {
    const { customColors } = get();
    if (!customColors.includes(color)) {
      set({ customColors: [...customColors.slice(-9), color] });
    }
  },

  startStroke: (point: Point) => {
    const { currentTool, color, size, opacity } = get();
    const strokeId = generateStrokeId();

    const style: StrokeStyle = { tool: currentTool, color, size, opacity };

    // Add timestamp and initial velocity to the first point
    const pointWithMeta: Point = {
      ...point,
      timestamp: Date.now(),
      velocity: 0
    };

    const stroke: Stroke = {
      id: strokeId,
      points: [pointWithMeta],
      style,
      timestamp: Date.now()
    };

    set({ currentStroke: stroke, isDrawing: true });

    // Emit to server
    const socket = getSocket();
    socket.emit('canvas:stroke_start', {
      strokeId,
      point: pointWithMeta,
      style
    });
  },

  addPoint: (point: Point) => {
    const { currentStroke, isDrawing } = get();
    if (!isDrawing || !currentStroke) return;

    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    const now = Date.now();
    const lastTime = lastPoint.timestamp ?? now;
    const dt = Math.max(now - lastTime, 1); // Avoid division by zero

    // Calculate distance and velocity
    const dx = point.x - lastPoint.x;
    const dy = point.y - lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = distance / dt; // pixels per millisecond

    const pointWithMeta: Point = {
      ...point,
      timestamp: now,
      velocity
    };

    const updatedStroke: Stroke = {
      ...currentStroke,
      points: [...currentStroke.points, pointWithMeta]
    };

    set({ currentStroke: updatedStroke });

    // Emit to server (batched points would be more efficient)
    const socket = getSocket();
    socket.emit('canvas:stroke_data', {
      strokeId: currentStroke.id,
      points: [pointWithMeta]
    });
  },

  endStroke: () => {
    const { currentStroke, strokes } = get();
    if (!currentStroke) return;

    set({
      strokes: [...strokes, currentStroke],
      currentStroke: null,
      isDrawing: false,
      undoStack: [] // Clear redo stack on new action
    });

    // Emit to server
    const socket = getSocket();
    socket.emit('canvas:stroke_end', { strokeId: currentStroke.id });
  },

  fill: (point: Point) => {
    const { color, fillActions } = get();
    const fillId = generateFillId();

    const fillAction: FillAction = {
      id: fillId,
      type: 'fill',
      point,
      color,
      timestamp: Date.now()
    };

    set({ fillActions: [...fillActions, fillAction], undoStack: [] });

    const socket = getSocket();
    socket.emit('canvas:fill', { point, color, fillId });
  },

  clear: () => {
    set({ strokes: [], fillActions: [], undoStack: [] });

    const socket = getSocket();
    socket.emit('canvas:clear');
  },

  undo: () => {
    const { strokes, fillActions, undoStack } = get();
    if (strokes.length === 0 && fillActions.length === 0) return;

    const lastStroke = strokes.length > 0 ? strokes[strokes.length - 1] : null;
    const lastFill = fillActions.length > 0 ? fillActions[fillActions.length - 1] : null;

    // Determine which action was most recent by timestamp
    const undoFill = lastFill && (!lastStroke || lastFill.timestamp >= lastStroke.timestamp);

    if (undoFill && lastFill) {
      set({
        fillActions: fillActions.slice(0, -1),
        undoStack: [...undoStack, lastFill]
      });
    } else if (lastStroke) {
      set({
        strokes: strokes.slice(0, -1),
        undoStack: [...undoStack, lastStroke]
      });
    }

    const socket = getSocket();
    socket.emit('canvas:undo');
  },

  redo: () => {
    const { strokes, fillActions, undoStack } = get();
    if (undoStack.length === 0) return;

    const actionToRedo = undoStack[undoStack.length - 1];

    if ('type' in actionToRedo && actionToRedo.type === 'fill') {
      set({
        fillActions: [...fillActions, actionToRedo as FillAction],
        undoStack: undoStack.slice(0, -1)
      });
    } else {
      set({
        strokes: [...strokes, actionToRedo as Stroke],
        undoStack: undoStack.slice(0, -1)
      });
    }
  },

  // Remote event handlers
  addRemoteStroke: (stroke: Stroke) => {
    const { strokes } = get();
    set({ strokes: [...strokes, stroke] });
  },

  handleRemoteStrokeStart: (strokeId: string, point: Point, style: StrokeStyle) => {
    const stroke: Stroke = {
      id: strokeId,
      points: [point],
      style,
      timestamp: Date.now()
    };

    const { strokes } = get();
    set({ strokes: [...strokes, stroke] });
  },

  handleRemoteStrokeData: (strokeId: string, points: Point[]) => {
    const { strokes } = get();
    set({
      strokes: strokes.map(s =>
        s.id === strokeId
          ? { ...s, points: [...s.points, ...points] }
          : s
      )
    });
  },

  handleRemoteStrokeEnd: (_strokeId: string) => {
    // Stroke is already in strokes array
  },

  handleRemoteFill: (point: Point, color: string, fillId?: string) => {
    const { fillActions } = get();
    const id = fillId || generateFillId();

    const fillAction: FillAction = {
      id,
      type: 'fill',
      point,
      color,
      timestamp: Date.now()
    };

    set({ fillActions: [...fillActions, fillAction] });
  },

  handleRemoteClear: () => {
    set({ strokes: [], fillActions: [], undoStack: [] });
  },

  handleRemoteUndo: (actionId: string) => {
    const { strokes, fillActions } = get();
    if (actionId.startsWith('fill_')) {
      set({ fillActions: fillActions.filter(f => f.id !== actionId) });
    } else {
      set({ strokes: strokes.filter(s => s.id !== actionId) });
    }
  },

  setupListeners: () => {
    const socket = getSocket();
    const {
      handleRemoteStrokeStart,
      handleRemoteStrokeData,
      handleRemoteStrokeEnd,
      handleRemoteFill,
      handleRemoteClear,
      handleRemoteUndo
    } = get();

    socket.on('canvas:stroke_start', ({ strokeId, point, style }) => {
      handleRemoteStrokeStart(strokeId, point, style);
    });

    socket.on('canvas:stroke_data', ({ strokeId, points }) => {
      handleRemoteStrokeData(strokeId, points);
    });

    socket.on('canvas:stroke_end', ({ strokeId }) => {
      handleRemoteStrokeEnd(strokeId);
    });

    socket.on('canvas:fill', ({ point, color, fillId }: any) => {
      handleRemoteFill(point, color, fillId);
    });

    socket.on('canvas:clear', () => {
      handleRemoteClear();
    });

    socket.on('canvas:undo', ({ actionId, strokeId }) => {
      handleRemoteUndo(actionId || strokeId || '');
    });

    socket.on('canvas:state', ({ strokes }) => {
      set({ strokes });
    });

    return () => {
      socket.off('canvas:stroke_start');
      socket.off('canvas:stroke_data');
      socket.off('canvas:stroke_end');
      socket.off('canvas:fill');
      socket.off('canvas:clear');
      socket.off('canvas:undo');
      socket.off('canvas:state');
    };
  },

  reset: () => {
    set({
      strokes: [],
      fillActions: [],
      currentStroke: null,
      undoStack: [],
      isDrawing: false,
      currentTool: 'pencil',
      color: DEFAULT_COLORS[0],
      size: TOOL_DEFAULTS.pen.size!,
      opacity: TOOL_DEFAULTS.pen.opacity!
    });
  }
}));
