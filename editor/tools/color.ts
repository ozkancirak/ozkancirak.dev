/**
 * sRGB to OKLab.
 *
 * The magic wand compares colours here rather than in raw RGB, which is the
 * one change that most improves a selection. RGB distance is not perceptual:
 * two shadow tones a person reads as the same grey can sit further apart in
 * RGB than a mid-grey and a mid-blue, so an RGB tolerance either leaks into
 * the subject or leaves a rim of unselected background. OKLab distance tracks
 * what the eye actually reports, which is exactly what a tolerance slider is
 * trying to express.
 */

/** 8-bit sRGB to linear light. A table because the alternative is a pow() per channel per pixel. */
const LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LINEAR[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * How much a difference in alpha counts toward the total distance. Half a unit
 * for fully transparent against fully opaque — enough that the wand does not
 * wander across a cut edge, not so much that it dominates hue.
 */
const ALPHA_WEIGHT = 0.5;

export type Oklab = { L: number; a: number; b: number; alpha: number };

export function oklab(r: number, g: number, b: number, alpha: number): Oklab {
  const lr = LINEAR[r];
  const lg = LINEAR[g];
  const lb = LINEAR[b];

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    alpha: alpha / 255,
  };
}

/** Euclidean distance in OKLab, with alpha folded in. */
export function distance(
  reference: Oklab,
  r: number,
  g: number,
  b: number,
  alpha: number
): number {
  const lr = LINEAR[r];
  const lg = LINEAR[g];
  const lb = LINEAR[b];

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const dL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s - reference.L;
  const da = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s - reference.a;
  const db = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s - reference.b;
  const dAlpha = (alpha / 255 - reference.alpha) * ALPHA_WEIGHT;

  return Math.sqrt(dL * dL + da * da + db * db + dAlpha * dAlpha);
}

/**
 * Slider position (0..100) to an OKLab radius.
 *
 * The curve is deliberate: most real work happens below 40, where fine control
 * matters, so the low end is stretched. Tuned by eye against photographs — the
 * numbers are meant to be adjusted, not defended.
 */
export function toleranceRadius(tolerance: number): number {
  const t = Math.min(100, Math.max(0, tolerance)) / 100;
  return Math.pow(t, 1.5) * 0.5;
}
