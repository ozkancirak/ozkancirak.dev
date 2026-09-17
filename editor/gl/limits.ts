let cached: number | null = null;

/**
 * The largest texture this GPU will accept. Worth checking before opening a
 * file: exceed it and the upload silently produces nothing, which reads as a
 * broken editor rather than an image that is too big.
 */
export function maxTextureSize(): number {
  if (cached !== null) return cached;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  cached = gl ? (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) : 4096;

  // Release the probe context rather than leaving it to the GC.
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return cached;
}
