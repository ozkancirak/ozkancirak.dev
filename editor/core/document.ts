import { PixelSurface, type Surface } from "./surface";

/**
 * Photoshop's full set. The last four are the non-separable modes — they mix
 * whole colours rather than each channel on its own, so the compositor needs a
 * second code path for them.
 */
export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
] as const;

export type BlendMode = (typeof BLEND_MODES)[number];

export const NON_SEPARABLE_BLEND_MODES: readonly BlendMode[] = [
  "hue",
  "saturation",
  "color",
  "luminosity",
];

export type LayerId = string;

/**
 * Faz 1 keeps every layer the size of the document, so the compositor needs no
 * per-layer offset. PSD import brings layers with their own bounds; that is
 * where `x`/`y` will have to arrive, along with offset-aware selection and
 * painting.
 */
export type Layer = {
  id: LayerId;
  name: string;
  visible: boolean;
  /** 0..1 */
  opacity: number;
  blendMode: BlendMode;
  surface: Surface;
  /**
   * Where every selection lands. Opaque greyscale, and coverage is read from
   * the red channel — white shows the pixel, black hides it, exactly as
   * Photoshop treats a layer mask. Pixels are never destroyed, so a cutout
   * stays editable forever.
   */
  mask: Surface | null;
  maskEnabled: boolean;
};

export type EditorDocument = {
  name: string;
  width: number;
  height: number;
  /**
   * Bottom-first, which is compositing order (and PSD's own order). The layers
   * panel reverses it for display.
   */
  layers: Layer[];
  selectedLayerId: LayerId | null;
};

let nextId = 0;

export function createLayerId(): LayerId {
  nextId += 1;
  return `layer-${nextId}`;
}

export function createLayer(
  surface: Surface,
  overrides: Partial<Omit<Layer, "surface">> = {}
): Layer {
  return {
    id: overrides.id ?? createLayerId(),
    name: overrides.name ?? "Katman",
    visible: overrides.visible ?? true,
    opacity: overrides.opacity ?? 1,
    blendMode: overrides.blendMode ?? "normal",
    surface,
    mask: overrides.mask ?? null,
    maskEnabled: overrides.maskEnabled ?? true,
  };
}

export function createDocument(
  name: string,
  width: number,
  height: number,
  layers: Layer[] = []
): EditorDocument {
  return {
    name,
    width,
    height,
    layers,
    selectedLayerId: layers.length ? layers[layers.length - 1].id : null,
  };
}

/** A document holding one image, which is what opening a file produces. */
export function documentFromImage(name: string, image: ImageData): EditorDocument {
  const layer = createLayer(PixelSurface.fromImageData(image), { name });
  return createDocument(name, image.width, image.height, [layer]);
}

export function findLayer(doc: EditorDocument, id: LayerId | null): Layer | null {
  if (id === null) return null;
  return doc.layers.find((layer) => layer.id === id) ?? null;
}

export function layerIndex(doc: EditorDocument, id: LayerId): number {
  return doc.layers.findIndex((layer) => layer.id === id);
}

export function selectedLayer(doc: EditorDocument): Layer | null {
  return findLayer(doc, doc.selectedLayerId);
}

/** Top-first, the order the layers panel shows. */
export function layersTopFirst(doc: EditorDocument): Layer[] {
  return [...doc.layers].reverse();
}

/**
 * A full-coverage mask: white everywhere, so attaching one to a layer changes
 * nothing until something is painted into it.
 */
export function createMask(width: number, height: number): Surface {
  return PixelSurface.filled(width, height, [255, 255, 255, 255]);
}

/** Mask coverage 0..255 packed the way the compositor reads it back. */
export function maskPixel(coverage: number): [number, number, number, number] {
  const v = Math.max(0, Math.min(255, Math.round(coverage)));
  return [v, v, v, 255];
}
