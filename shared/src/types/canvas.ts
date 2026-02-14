export type ToolType = 'pencil' | 'pen' | 'brush' | 'fill' | 'eraser';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
  velocity?: number;
}

export interface StrokeStyle {
  tool: ToolType;
  color: string;
  size: number;
  opacity: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  style: StrokeStyle;
  timestamp: number;
}

export interface StrokeStartData {
  strokeId: string;
  point: Point;
  style: StrokeStyle;
}

export interface StrokeData {
  strokeId: string;
  points: Point[];
}

export interface StrokeEndData {
  strokeId: string;
}

export interface FillData {
  point: Point;
  color: string;
  tolerance?: number;
}

export interface FillAction {
  id: string;
  type: 'fill';
  point: Point;
  color: string;
  timestamp: number;
}

export interface ClearData {
  timestamp: number;
}

export interface UndoData {
  strokeId: string;
}

export interface RedoData {
  strokeId: string;
}

export interface CanvasState {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  undoStack: Stroke[];
  width: number;
  height: number;
}

export interface ToolSettings {
  tool: ToolType;
  color: string;
  size: number;
  opacity: number;
}

export const DEFAULT_COLORS = [
  '#000000', '#FFFFFF', '#9CA3AF', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6',
  '#EC4899', '#78350F', '#7C2D12', '#365314', '#1E3A5F',
  '#4C1D95', '#831843', '#FCA5A5', '#FDE68A', '#BBF7D0'
] as const;

export const TOOL_DEFAULTS: Record<ToolType, Partial<ToolSettings>> = {
  pencil: { size: 2, opacity: 1 },
  pen: { size: 4, opacity: 1 },
  brush: { size: 20, opacity: 0.7 },
  fill: { opacity: 1 },
  eraser: { size: 20, opacity: 1 }
};
