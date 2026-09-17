import { BLEND_MODES, type BlendMode } from "@/editor/core/document";

/** The shader's switch reads this index, so the order here is load-bearing. */
export function blendModeIndex(mode: BlendMode): number {
  return BLEND_MODES.indexOf(mode);
}

/**
 * Maps a unit quad onto a destination rect given in clip space, so one vertex
 * shader serves both the compositing passes and the final blit.
 */
export const QUAD_VERTEX = `#version 300 es
in vec2 aPos;
uniform vec4 uDest;
uniform bool uFlipY;
out vec2 vUV;

void main() {
  vUV = vec2(aPos.x, uFlipY ? 1.0 - aPos.y : aPos.y);
  gl_Position = vec4(uDest.xy + aPos * uDest.zw, 0.0, 1.0);
}
`;

/**
 * One layer blended over the accumulated backdrop.
 *
 * Straight (non-premultiplied) alpha throughout, matching how PixelSurface
 * stores pixels, and following the W3C compositing formulas rather than fixed
 * function GL blending — which cannot express multiply, overlay or the four
 * non-separable modes at all.
 */
export const COMPOSITE_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uBackdrop;
uniform sampler2D uSource;
uniform sampler2D uMask;
uniform bool uHasMask;
uniform float uOpacity;
uniform int uBlendMode;

float softLightChannel(float b, float s) {
  if (s <= 0.5) return b - (1.0 - 2.0 * s) * b * (1.0 - b);
  float d = (b <= 0.25) ? ((16.0 * b - 12.0) * b + 4.0) * b : sqrt(b);
  return b + (2.0 * s - 1.0) * (d - b);
}

float dodgeChannel(float b, float s) {
  if (b <= 0.0) return 0.0;
  if (s >= 1.0) return 1.0;
  return min(1.0, b / (1.0 - s));
}

float burnChannel(float b, float s) {
  if (b >= 1.0) return 1.0;
  if (s <= 0.0) return 0.0;
  return 1.0 - min(1.0, (1.0 - b) / s);
}

float hardLightChannel(float b, float s) {
  return (s <= 0.5)
    ? b * (2.0 * s)
    : (b + (2.0 * s - 1.0) - b * (2.0 * s - 1.0));
}

// --- non-separable helpers, straight from the PDF blend model -------------

float lum(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }

vec3 clipColor(vec3 c) {
  float l = lum(c);
  float lo = min(c.r, min(c.g, c.b));
  float hi = max(c.r, max(c.g, c.b));
  if (lo < 0.0) c = l + (c - l) * l / max(l - lo, 1e-6);
  if (hi > 1.0) c = l + (c - l) * (1.0 - l) / max(hi - l, 1e-6);
  return c;
}

vec3 setLum(vec3 c, float l) { return clipColor(c + (l - lum(c))); }

float sat(vec3 c) {
  return max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
}

vec3 setSat(vec3 c, float s) {
  float lo = min(c.r, min(c.g, c.b));
  float hi = max(c.r, max(c.g, c.b));
  return (hi > lo) ? (c - lo) * s / (hi - lo) : vec3(0.0);
}

vec3 blend(vec3 b, vec3 s, int mode) {
  if (mode == 0) return s;
  if (mode == 1) return b * s;
  if (mode == 2) return b + s - b * s;
  if (mode == 3) return vec3(hardLightChannel(s.r, b.r), hardLightChannel(s.g, b.g), hardLightChannel(s.b, b.b));
  if (mode == 4) return min(b, s);
  if (mode == 5) return max(b, s);
  if (mode == 6) return vec3(dodgeChannel(b.r, s.r), dodgeChannel(b.g, s.g), dodgeChannel(b.b, s.b));
  if (mode == 7) return vec3(burnChannel(b.r, s.r), burnChannel(b.g, s.g), burnChannel(b.b, s.b));
  if (mode == 8) return vec3(hardLightChannel(b.r, s.r), hardLightChannel(b.g, s.g), hardLightChannel(b.b, s.b));
  if (mode == 9) return vec3(softLightChannel(b.r, s.r), softLightChannel(b.g, s.g), softLightChannel(b.b, s.b));
  if (mode == 10) return abs(b - s);
  if (mode == 11) return b + s - 2.0 * b * s;
  if (mode == 12) return setLum(setSat(s, sat(b)), lum(b));
  if (mode == 13) return setLum(setSat(b, sat(s)), lum(b));
  if (mode == 14) return setLum(s, lum(b));
  if (mode == 15) return setLum(b, lum(s));
  return s;
}

void main() {
  vec4 backdrop = texture(uBackdrop, vUV);
  vec4 source = texture(uSource, vUV);

  float alpha = source.a * uOpacity;
  // Mask coverage rides in the red channel — the mask is opaque greyscale.
  if (uHasMask) alpha *= texture(uMask, vUV).r;

  float ab = backdrop.a;
  vec3 mixed = blend(backdrop.rgb, source.rgb, uBlendMode);

  // Cs' — the source colour after a backdrop-aware blend, weighted by how
  // much backdrop there actually is.
  vec3 cr = (1.0 - ab) * source.rgb + ab * mixed;

  float ao = alpha + ab * (1.0 - alpha);
  if (ao <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  fragColor = vec4((alpha * cr + ab * (1.0 - alpha) * backdrop.rgb) / ao, ao);
}
`;

/**
 * Final blit. The checkerboard is generated in screen space so it stays the
 * same size at every zoom level, the way every editor draws it.
 */
export const SCREEN_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uImage;
uniform float uCheckerSize;
uniform vec3 uCheckerA;
uniform vec3 uCheckerB;

void main() {
  vec2 cell = floor(gl_FragCoord.xy / uCheckerSize);
  vec3 checker = mod(cell.x + cell.y, 2.0) < 0.5 ? uCheckerA : uCheckerB;

  vec4 image = texture(uImage, vUV);
  fragColor = vec4(mix(checker, image.rgb, image.a), 1.0);
}
`;

/**
 * Marching ants.
 *
 * The outline is found by edge detection on the coverage field rather than by
 * tracing a path: a pixel is on the border when it is inside the selection and
 * at least one neighbour is not. The dash phase comes from gl_FragCoord, so
 * the ants keep the same size and speed at every zoom level — a selection
 * outline is chrome, not part of the picture.
 */
export const SELECTION_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uCoverage;
uniform vec2 uStep;
uniform float uTime;
uniform float uDash;

float inside(vec2 uv) {
  return texture(uCoverage, uv).r >= 0.5 ? 1.0 : 0.0;
}

void main() {
  float here = inside(vUV);
  if (here < 0.5) {
    fragColor = vec4(0.0);
    return;
  }

  float up = inside(vUV + vec2(0.0, uStep.y));
  float down = inside(vUV - vec2(0.0, uStep.y));
  float right = inside(vUV + vec2(uStep.x, 0.0));
  float left = inside(vUV - vec2(uStep.x, 0.0));

  // Any neighbour outside the selection makes this a border pixel.
  if (min(min(up, down), min(left, right)) > 0.5) {
    fragColor = vec4(0.0);
    return;
  }

  float phase = mod(
    floor((gl_FragCoord.x + gl_FragCoord.y) / uDash + uTime),
    2.0
  );
  fragColor = vec4(vec3(phase), 1.0);
}
`;
