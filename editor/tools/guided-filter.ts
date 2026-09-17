/**
 * Fast guided filter with a colour guide (He, Sun & Tang).
 *
 * What it does, measured rather than hoped for: it takes a coverage field that
 * is soft or uncertain around a boundary and snaps that boundary onto the
 * edge the photograph actually has. On a soft alpha spread over forty pixels
 * the steepest step goes from 10/255 to 125/255 while the crossing point stays
 * put — a clean cut instead of a smear. An edge that is already correct is
 * left alone.
 *
 * What it does NOT do, also measured: reconstruct detail that is gone. Given a
 * mask whose hair strands have been blurred down to a contrast of 1.5/255, no
 * combination of radius, epsilon or subsampling gets past about 5/255 against
 * a true contrast of 255. It is a local linear filter, not a matting solver —
 * it amplifies structure that survived, it cannot invent structure that did
 * not. Strand-level reconstruction needs a matting model or a closed-form
 * matting solve, and that is a separate piece of work.
 *
 * The guide is the full colour image rather than its luminance. That costs a
 * 3x3 solve per pixel, and it earns it: dark hair against a dark but
 * differently-hued background is exactly the case luminance cannot separate.
 *
 * "Fast" means the coefficients are fitted on a subsampled copy and then
 * upsampled — the published trick. It is both quicker and dramatically lighter
 * on memory: at full resolution the thirteen intermediate buffers this needs
 * would run past a gigabyte on a 12-megapixel photo.
 */

export type GuidedFilterOptions = {
  /** Neighbourhood radius in full-resolution pixels. */
  radius: number;
  /**
   * Regularisation. Small values follow the guide's edges hard (crisp, and
   * noisier); larger values smooth across them.
   */
  epsilon: number;
  /** Subsampling factor for the coefficient fit. */
  subsample: number;
};

export const DEFAULT_OPTIONS: GuidedFilterOptions = {
  radius: 16,
  epsilon: 1e-4,
  subsample: 4,
};

/**
 * Separable box blur over a running sum: O(n) regardless of radius, and it
 * needs one scratch buffer rather than the integral image's wider float type.
 * Edges divide by the number of samples actually in range.
 */
function boxBlur(
  source: Float32Array,
  width: number,
  height: number,
  radius: number
): Float32Array {
  const horizontal = new Float32Array(width * height);
  const output = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;

    for (let x = 0; x <= Math.min(radius, width - 1); x++) sum += source[row + x];

    for (let x = 0; x < width; x++) {
      const left = x - radius - 1;
      const right = x + radius;

      if (x > 0) {
        if (right < width) sum += source[row + right];
        if (left >= 0) sum -= source[row + left];
      }

      const from = Math.max(0, x - radius);
      const to = Math.min(width - 1, x + radius);
      horizontal[row + x] = sum / (to - from + 1);
    }
  }

  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = 0; y <= Math.min(radius, height - 1); y++) {
      sum += horizontal[y * width + x];
    }

    for (let y = 0; y < height; y++) {
      const top = y - radius - 1;
      const bottom = y + radius;

      if (y > 0) {
        if (bottom < height) sum += horizontal[bottom * width + x];
        if (top >= 0) sum -= horizontal[top * width + x];
      }

      const from = Math.max(0, y - radius);
      const to = Math.min(height - 1, y + radius);
      output[y * width + x] = sum / (to - from + 1);
    }
  }

  return output;
}

/** Nearest-neighbour shrink. Good enough: the result is box-blurred anyway. */
function shrink(
  source: Float32Array,
  width: number,
  height: number,
  smallWidth: number,
  smallHeight: number
): Float32Array {
  const output = new Float32Array(smallWidth * smallHeight);

  for (let y = 0; y < smallHeight; y++) {
    const sy = Math.min(height - 1, Math.floor(((y + 0.5) * height) / smallHeight));
    for (let x = 0; x < smallWidth; x++) {
      const sx = Math.min(width - 1, Math.floor(((x + 0.5) * width) / smallWidth));
      output[y * smallWidth + x] = source[sy * width + sx];
    }
  }

  return output;
}

/** Bilinear sample of a low-resolution plane at full-resolution coordinates. */
function sampleBilinear(
  source: Float32Array,
  smallWidth: number,
  smallHeight: number,
  u: number,
  v: number
): number {
  const x = Math.min(smallWidth - 1, Math.max(0, u * smallWidth - 0.5));
  const y = Math.min(smallHeight - 1, Math.max(0, v * smallHeight - 0.5));

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(smallWidth - 1, x0 + 1);
  const y1 = Math.min(smallHeight - 1, y0 + 1);

  const fx = x - x0;
  const fy = y - y0;

  const top =
    source[y0 * smallWidth + x0] * (1 - fx) + source[y0 * smallWidth + x1] * fx;
  const bottom =
    source[y1 * smallWidth + x0] * (1 - fx) + source[y1 * smallWidth + x1] * fx;

  return top * (1 - fy) + bottom * fy;
}

export function guidedFilter(
  guide: Uint8ClampedArray,
  coverage: Uint8ClampedArray,
  width: number,
  height: number,
  options: Partial<GuidedFilterOptions> = {}
): Uint8ClampedArray {
  const { radius, epsilon, subsample } = { ...DEFAULT_OPTIONS, ...options };

  const count = width * height;
  const output = new Uint8ClampedArray(count);
  if (count === 0) return output;

  // Full-resolution guide channels, normalised. Needed at the end anyway, so
  // they are built once rather than sampled out of the RGBA buffer twice.
  const fullR = new Float32Array(count);
  const fullG = new Float32Array(count);
  const fullB = new Float32Array(count);
  const fullP = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const o = i * 4;
    fullR[i] = guide[o] / 255;
    fullG[i] = guide[o + 1] / 255;
    fullB[i] = guide[o + 2] / 255;
    fullP[i] = coverage[i] / 255;
  }

  const scale = Math.max(1, Math.round(subsample));
  const sw = Math.max(1, Math.round(width / scale));
  const sh = Math.max(1, Math.round(height / scale));
  const sr = Math.max(1, Math.round(radius / scale));
  const small = sw * sh;

  const r = shrink(fullR, width, height, sw, sh);
  const g = shrink(fullG, width, height, sw, sh);
  const b = shrink(fullB, width, height, sw, sh);
  const p = shrink(fullP, width, height, sw, sh);

  const meanR = boxBlur(r, sw, sh, sr);
  const meanG = boxBlur(g, sw, sh, sr);
  const meanB = boxBlur(b, sw, sh, sr);
  const meanP = boxBlur(p, sw, sh, sr);

  const product = (a: Float32Array, c: Float32Array) => {
    const out = new Float32Array(small);
    for (let i = 0; i < small; i++) out[i] = a[i] * c[i];
    return out;
  };

  const corrRP = boxBlur(product(r, p), sw, sh, sr);
  const corrGP = boxBlur(product(g, p), sw, sh, sr);
  const corrBP = boxBlur(product(b, p), sw, sh, sr);

  const corrRR = boxBlur(product(r, r), sw, sh, sr);
  const corrRG = boxBlur(product(r, g), sw, sh, sr);
  const corrRB = boxBlur(product(r, b), sw, sh, sr);
  const corrGG = boxBlur(product(g, g), sw, sh, sr);
  const corrGB = boxBlur(product(g, b), sw, sh, sr);
  const corrBB = boxBlur(product(b, b), sw, sh, sr);

  /**
   * Below this the solve is treated as numerically dead. It has to be tied to
   * epsilon, not fixed: the regularised covariance has eigenvalues of at least
   * epsilon, so its determinant is at least epsilon cubed — and a two-colour
   * edge, the most common case there is, makes the unregularised matrix rank
   * one and drives the determinant right down to that floor. A fixed threshold
   * disables the filter exactly where it is supposed to work.
   */
  const singular = epsilon * epsilon * epsilon * 1e-3;

  const aR = new Float32Array(small);
  const aG = new Float32Array(small);
  const aB = new Float32Array(small);
  const bias = new Float32Array(small);

  for (let i = 0; i < small; i++) {
    const mr = meanR[i];
    const mg = meanG[i];
    const mb = meanB[i];
    const mp = meanP[i];

    // Covariance of the guide within the window, regularised on the diagonal.
    const rr = corrRR[i] - mr * mr + epsilon;
    const rg = corrRG[i] - mr * mg;
    const rb = corrRB[i] - mr * mb;
    const gg = corrGG[i] - mg * mg + epsilon;
    const gb = corrGB[i] - mg * mb;
    const bb = corrBB[i] - mb * mb + epsilon;

    const covR = corrRP[i] - mr * mp;
    const covG = corrGP[i] - mg * mp;
    const covB = corrBP[i] - mb * mp;

    // Closed-form inverse of the symmetric 3x3, via its adjugate.
    const c00 = gg * bb - gb * gb;
    const c01 = rb * gb - rg * bb;
    const c02 = rg * gb - rb * gg;
    const det = rr * c00 + rg * c01 + rb * c02;

    if (!Number.isFinite(det) || det <= singular) {
      // Degenerate window — a flat patch. Fall back to the plain average.
      aR[i] = 0;
      aG[i] = 0;
      aB[i] = 0;
      bias[i] = mp;
      continue;
    }

    const c11 = rr * bb - rb * rb;
    const c12 = rb * rg - rr * gb;
    const c22 = rr * gg - rg * rg;
    const inv = 1 / det;

    const ar = (c00 * covR + c01 * covG + c02 * covB) * inv;
    const ag = (c01 * covR + c11 * covG + c12 * covB) * inv;
    const ab = (c02 * covR + c12 * covG + c22 * covB) * inv;

    aR[i] = ar;
    aG[i] = ag;
    aB[i] = ab;
    bias[i] = mp - ar * mr - ag * mg - ab * mb;
  }

  const meanAR = boxBlur(aR, sw, sh, sr);
  const meanAG = boxBlur(aG, sw, sh, sr);
  const meanAB = boxBlur(aB, sw, sh, sr);
  const meanBias = boxBlur(bias, sw, sh, sr);

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const i = y * width + x;

      const value =
        sampleBilinear(meanAR, sw, sh, u, v) * fullR[i] +
        sampleBilinear(meanAG, sw, sh, u, v) * fullG[i] +
        sampleBilinear(meanAB, sw, sh, u, v) * fullB[i] +
        sampleBilinear(meanBias, sw, sh, u, v);

      output[i] = Math.round(Math.min(1, Math.max(0, value)) * 255);
    }
  }

  return output;
}
