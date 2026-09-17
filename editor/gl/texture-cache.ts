import { union, type Rect } from "@/editor/core/geometry";
import type { Surface } from "@/editor/core/surface";
import { createTexture } from "./glutil";

type Entry = {
  texture: WebGLTexture;
  /** The surface revision this texture reflects. */
  revision: number;
  /** Regions changed but not yet uploaded, unioned across frames. */
  pending: Rect | null;
  uploaded: boolean;
  seen: number;
};

/**
 * Keeps one GPU texture per surface and re-uploads only what changed.
 *
 * This is the sole consumer of `Surface.takeDirty()` — that call clears the
 * dirty region, so a second consumer would silently steal updates.
 */
export class TextureCache {
  private readonly entries = new Map<Surface, Entry>();
  private frame = 0;

  constructor(private readonly gl: WebGL2RenderingContext) {}

  /** Call once per rendered frame, before any get(). */
  beginFrame() {
    this.frame += 1;
  }

  get(surface: Surface): WebGLTexture {
    const gl = this.gl;
    let entry = this.entries.get(surface);

    if (!entry) {
      entry = {
        texture: createTexture(gl, surface.width, surface.height),
        revision: -1,
        pending: null,
        uploaded: false,
        seen: this.frame,
      };
      this.entries.set(surface, entry);
    }

    entry.seen = this.frame;
    entry.pending = union(entry.pending, surface.takeDirty());

    if (entry.revision === surface.revision) return entry.texture;

    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    if (entry.uploaded && entry.pending) {
      // read(region) hands back just that region, tightly packed — which is
      // the whole reason to track a dirty rect. Reading the full surface here
      // would copy the entire layer on every brush dab.
      const region = entry.pending;
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        region.x,
        region.y,
        region.width,
        region.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        surface.read(region).data
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        surface.width,
        surface.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        surface.read().data
      );
      entry.uploaded = true;
    }

    entry.revision = surface.revision;
    entry.pending = null;
    return entry.texture;
  }

  /** Drops textures for surfaces that no frame has asked for lately. */
  collect(maxAge = 120) {
    for (const [surface, entry] of this.entries) {
      if (this.frame - entry.seen <= maxAge) continue;
      this.gl.deleteTexture(entry.texture);
      this.entries.delete(surface);
    }
  }

  dispose() {
    for (const entry of this.entries.values()) {
      this.gl.deleteTexture(entry.texture);
    }
    this.entries.clear();
  }
}
