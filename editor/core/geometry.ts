export type Rect = { x: number; y: number; width: number; height: number };

export function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

export function isEmpty(r: Rect | null): r is null {
  return r === null || r.width <= 0 || r.height <= 0;
}

/** Smallest rect containing both. Either side may be null. */
export function union(a: Rect | null, b: Rect | null): Rect | null {
  if (isEmpty(a)) return isEmpty(b) ? null : b;
  if (isEmpty(b)) return a;

  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/** Overlap of two rects, or null when they miss each other. */
export function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  if (right <= x || bottom <= y) return null;
  return { x, y, width: right - x, height: bottom - y };
}

/** Snap to whole pixels, growing outward so nothing written is left uncovered. */
export function outset(r: Rect): Rect {
  const x = Math.floor(r.x);
  const y = Math.floor(r.y);
  return {
    x,
    y,
    width: Math.ceil(r.x + r.width) - x,
    height: Math.ceil(r.y + r.height) - y,
  };
}

export function equals(a: Rect, b: Rect): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}
