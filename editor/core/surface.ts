import { intersect, isEmpty, outset, union, type Rect } from "./geometry";

/**
 * Pixel storage for one layer or mask.
 *
 * Faz 1 ships a single-texture implementation, which is plenty at photo scale.
 * The interface exists so a tiled implementation can take its place for
 * PSD-scale documents without the renderer, the commands or the history
 * knowing about it — that swap is the expensive one to retrofit, this
 * indirection is nearly free.
 */
export interface Surface {
  readonly width: number;
  readonly height: number;
  /** Bumped on every write. Consumers compare it to detect change. */
  readonly revision: number;
  /** Union of every region written since the last takeDirty(), then cleared. */
  takeDirty(): Rect | null;
  /** Copy of a region (the whole surface when omitted). */
  read(region?: Rect): ImageData;
  write(region: Rect, data: ImageData): void;
  clone(): Surface;
  bounds(): Rect;
  /**
   * Nearest-neighbour downsample, for layer thumbnails. It exists on the
   * interface so callers never read a full-size copy just to draw a 34px
   * square — on a 6000x4000 layer that copy is ~96 MB.
   */
  thumbnail(width: number, height: number): ImageData;
}

export class PixelSurface implements Surface {
  readonly width: number;
  readonly height: number;
  /** RGBA8, row-major, premultiplication-free. */
  readonly data: Uint8ClampedArray;

  private _revision = 0;
  private _dirty: Rect | null = null;

  constructor(width: number, height: number, data?: Uint8ClampedArray) {
    if (width <= 0 || height <= 0) {
      throw new RangeError(`Surface must be at least 1×1, got ${width}×${height}`);
    }

    this.width = width;
    this.height = height;
    this.data = data ?? new Uint8ClampedArray(width * height * 4);

    if (this.data.length !== width * height * 4) {
      throw new RangeError(
        `Buffer of ${this.data.length} bytes does not match ${width}×${height}`
      );
    }
  }

  static fromImageData(image: ImageData): PixelSurface {
    return new PixelSurface(
      image.width,
      image.height,
      new Uint8ClampedArray(image.data)
    );
  }

  /** An opaque surface filled with one colour, e.g. a fresh background layer. */
  static filled(width: number, height: number, rgba: [number, number, number, number]) {
    const surface = new PixelSurface(width, height);
    const [r, g, b, a] = rgba;
    for (let i = 0; i < surface.data.length; i += 4) {
      surface.data[i] = r;
      surface.data[i + 1] = g;
      surface.data[i + 2] = b;
      surface.data[i + 3] = a;
    }
    return surface;
  }

  get revision() {
    return this._revision;
  }

  bounds(): Rect {
    return { x: 0, y: 0, width: this.width, height: this.height };
  }

  takeDirty(): Rect | null {
    const dirty = this._dirty;
    this._dirty = null;
    return dirty;
  }

  /** Mark a region changed without going through write() — used by in-place edits. */
  markDirty(region: Rect) {
    const clipped = intersect(outset(region), this.bounds());
    if (isEmpty(clipped)) return;
    this._dirty = union(this._dirty, clipped);
    this._revision++;
  }

  read(region?: Rect): ImageData {
    const area = region ? intersect(outset(region), this.bounds()) : this.bounds();
    if (isEmpty(area)) {
      throw new RangeError("Cannot read an empty region");
    }

    const out = new ImageData(area.width, area.height);
    const rowBytes = area.width * 4;

    for (let row = 0; row < area.height; row++) {
      const start = ((area.y + row) * this.width + area.x) * 4;
      out.data.set(this.data.subarray(start, start + rowBytes), row * rowBytes);
    }

    return out;
  }

  write(region: Rect, data: ImageData) {
    const target = intersect(outset(region), this.bounds());
    if (isEmpty(target)) return;

    if (data.width < target.width || data.height < target.height) {
      throw new RangeError(
        `Source ${data.width}×${data.height} is smaller than target ${target.width}×${target.height}`
      );
    }

    const rowBytes = target.width * 4;
    for (let row = 0; row < target.height; row++) {
      const from = row * data.width * 4;
      const to = ((target.y + row) * this.width + target.x) * 4;
      this.data.set(data.data.subarray(from, from + rowBytes), to);
    }

    this._dirty = union(this._dirty, target);
    this._revision++;
  }

  thumbnail(width: number, height: number): ImageData {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    const out = new ImageData(w, h);

    for (let y = 0; y < h; y++) {
      const sy = Math.min(this.height - 1, Math.floor(((y + 0.5) * this.height) / h));
      for (let x = 0; x < w; x++) {
        const sx = Math.min(this.width - 1, Math.floor(((x + 0.5) * this.width) / w));
        const from = (sy * this.width + sx) * 4;
        const to = (y * w + x) * 4;
        out.data[to] = this.data[from];
        out.data[to + 1] = this.data[from + 1];
        out.data[to + 2] = this.data[from + 2];
        out.data[to + 3] = this.data[from + 3];
      }
    }

    return out;
  }

  clone(): PixelSurface {
    return new PixelSurface(
      this.width,
      this.height,
      new Uint8ClampedArray(this.data)
    );
  }
}
