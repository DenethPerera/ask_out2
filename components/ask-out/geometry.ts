/** Viewport coordinates, in CSS pixels. */
export interface Point {
  x: number;
  y: number;
}

/** Viewport rect, in CSS pixels. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * What the celebration needs to know about the moment of acceptance: where she pressed
 * (so the light starts under her finger) and where the question card was (so its own
 * outline can be traced before it goes to light).
 */
export interface AcceptanceGeometry {
  origin: Point;
  cardRect: Rect | null;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
