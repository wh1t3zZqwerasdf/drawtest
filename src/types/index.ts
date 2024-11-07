export interface ImageState {
  url: string;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  scale: number;
}

export interface ToolState {
  activeTool: 'move' | 'erase' | 'crop' | 'text' | 'draw' | null;
  eraserSize: number;
  textContent: string;
  fontSize: number;
  color: string;
}

export interface Point {
  x: number;
  y: number;
}