import type { Rect } from "@/editor/core/geometry";
import { distance, oklab, toleranceRadius } from "./color";

export type FloodFillRequest = {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  seedX: number;
  seedY: number;
  /** Slider position, 0..100. */
  tolerance: number;
  /** true spreads only through touching pixels; false tests the whole image. */
  contiguous: boolean;
};

export type FloodFillResult = {
  /** One byte of coverage per pixel, 0..255. */
  coverage: Uint8ClampedArray;
  /** Tight bounds of everything selected, or null when nothing was. */
  bounds: Rect | null;
  selected: number;
};

/**
 * Where the soft edge comes from. Pixels comfortably inside the tolerance are
 * fully selected; those approaching the limit fade out, so the result is a
 * coverage field rather than a binary mask. That is what stops a cutout
 * looking like it was cut with pinking shears — and it is nearly free, because
 * the distance has already been computed.
 */
const SOLID_FRACTION = 0.75;

const TESTED = 1;
const FILLED = 2;

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x < edge1 ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function floodFill(request: FloodFillRequest): FloodFillResult {
  const { pixels, width, height, seedX, seedY, tolerance, contiguous } = request;

  const count = width * height;
  const coverage = new Uint8ClampedArray(Math.max(0, count));

  if (
    width <= 0 ||
    height <= 0 ||
    seedX < 0 ||
    seedY < 0 ||
    seedX >= width ||
    seedY >= height
  ) {
    return { coverage, bounds: null, selected: 0 };
  }

  const radius = toleranceRadius(tolerance);
  const solid = radius * SOLID_FRACTION;

  const seedOffset = (seedY * width + seedX) * 4;
  const reference = oklab(
    pixels[seedOffset],
    pixels[seedOffset + 1],
    pixels[seedOffset + 2],
    pixels[seedOffset + 3]
  );

  // One byte of bookkeeping per pixel. A Float32Array of cached distances
  // would be four times the memory — 96 MB on a 24-megapixel image — for the
  // same saving, since coverage is all the traversal ever needs to read back.
  const flags = new Uint8Array(count);

  /**
   * Coverage for a pixel, computed at most once. Three cbrt calls go into every
   * one of these, and the scanline walk asks about the same pixel from up to
   * four directions.
   */
  const coverageAt = (index: number): number => {
    if (flags[index] & TESTED) return coverage[index];
    flags[index] |= TESTED;

    const offset = index * 4;
    const d = distance(
      reference,
      pixels[offset],
      pixels[offset + 1],
      pixels[offset + 2],
      pixels[offset + 3]
    );

    const value =
      d <= solid
        ? 255
        : d >= radius
          ? 0
          : Math.round(255 * (1 - smoothstep(solid, radius, d)));

    coverage[index] = value;
    return value;
  };

  if (contiguous) {
    // Scanline flood fill over an explicit stack. The naive four-way recursive
    // version overflows the call stack on any real photograph; this walks a
    // whole horizontal run at a time and seeds the rows above and below once
    // per run rather than once per pixel.
    const stack: number[] = [seedX, seedY];

    while (stack.length > 0) {
      const y = stack.pop()!;
      const x = stack.pop()!;
      const row = y * width;

      if (flags[row + x] & FILLED) continue;
      if (coverageAt(row + x) === 0) continue;

      let left = x;
      while (left > 0 && coverageAt(row + left - 1) > 0) left--;

      let right = x;
      while (right < width - 1 && coverageAt(row + right + 1) > 0) right++;

      for (let i = left; i <= right; i++) flags[row + i] |= FILLED;

      for (const nextY of [y - 1, y + 1]) {
        if (nextY < 0 || nextY >= height) continue;
        const nextRow = nextY * width;

        let inRun = false;
        for (let i = left; i <= right; i++) {
          const index = nextRow + i;
          const usable = !(flags[index] & FILLED) && coverageAt(index) > 0;

          if (usable && !inRun) {
            stack.push(i, nextY);
            inRun = true;
          } else if (!usable) {
            inRun = false;
          }
        }
      }
    }

    // Pixels probed at the boundary of a run were scored but never joined the
    // region; clear them so coverage holds only what was actually selected.
    for (let index = 0; index < count; index++) {
      if (!(flags[index] & FILLED)) coverage[index] = 0;
    }
  } else {
    for (let index = 0; index < count; index++) coverageAt(index);
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let selected = 0;

  for (let index = 0; index < count; index++) {
    if (coverage[index] === 0) continue;

    selected += 1;
    const x = index % width;
    const y = (index - x) / width;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const bounds: Rect | null =
    maxX < 0
      ? null
      : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };

  return { coverage, bounds, selected };
}
