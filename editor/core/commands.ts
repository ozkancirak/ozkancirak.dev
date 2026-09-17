import {
  findLayer,
  layerIndex,
  type EditorDocument,
  type Layer,
  type LayerId,
} from "./document";
import type { Rect } from "./geometry";
import type { Surface } from "./surface";

/**
 * Every mutation goes through a command so it can be undone. Commands mutate
 * the document in place — pixel data is far too large to copy wholesale — and
 * each one captures exactly the undo data it needs at apply time.
 */
export interface Command {
  readonly label: string;
  apply(doc: EditorDocument): void;
  revert(doc: EditorDocument): void;
}

export type PixelTarget = "surface" | "mask";

/**
 * The workhorse. Snapshots only the region it is about to overwrite, which is
 * what keeps undo cheap during a brush stroke: a 64px dab costs 64px of undo,
 * not a copy of the whole layer.
 */
export class WritePixels implements Command {
  private before: ImageData | null = null;

  constructor(
    private readonly layerId: LayerId,
    private readonly target: PixelTarget,
    private readonly region: Rect,
    private readonly after: ImageData,
    readonly label = "Piksel düzenleme"
  ) {}

  private surfaceOf(doc: EditorDocument): Surface | null {
    const layer = findLayer(doc, this.layerId);
    if (!layer) return null;
    return this.target === "mask" ? layer.mask : layer.surface;
  }

  apply(doc: EditorDocument) {
    const surface = this.surfaceOf(doc);
    if (!surface) return;

    // Captured once: a redo must not mistake the post-edit state for the
    // original.
    if (this.before === null) this.before = surface.read(this.region);
    surface.write(this.region, this.after);
  }

  revert(doc: EditorDocument) {
    if (this.before === null) return;
    this.surfaceOf(doc)?.write(this.region, this.before);
  }
}

export type LayerProperties = Partial<
  Pick<Layer, "name" | "visible" | "opacity" | "blendMode" | "maskEnabled">
>;

export class SetLayerProperties implements Command {
  private before: LayerProperties | null = null;

  constructor(
    private readonly layerId: LayerId,
    private readonly next: LayerProperties,
    readonly label = "Katman ayarı"
  ) {}

  apply(doc: EditorDocument) {
    const layer = findLayer(doc, this.layerId);
    if (!layer) return;

    if (this.before === null) {
      const before: LayerProperties = {};
      if (this.next.name !== undefined) before.name = layer.name;
      if (this.next.visible !== undefined) before.visible = layer.visible;
      if (this.next.opacity !== undefined) before.opacity = layer.opacity;
      if (this.next.blendMode !== undefined) before.blendMode = layer.blendMode;
      if (this.next.maskEnabled !== undefined) before.maskEnabled = layer.maskEnabled;
      this.before = before;
    }

    Object.assign(layer, this.next);
  }

  revert(doc: EditorDocument) {
    const layer = findLayer(doc, this.layerId);
    if (layer && this.before) Object.assign(layer, this.before);
  }
}

export class AddLayer implements Command {
  private previousSelection: LayerId | null = null;

  constructor(
    private readonly layer: Layer,
    private readonly index?: number,
    readonly label = "Katman ekle"
  ) {}

  apply(doc: EditorDocument) {
    this.previousSelection = doc.selectedLayerId;
    doc.layers.splice(this.index ?? doc.layers.length, 0, this.layer);
    doc.selectedLayerId = this.layer.id;
  }

  revert(doc: EditorDocument) {
    const at = layerIndex(doc, this.layer.id);
    if (at >= 0) doc.layers.splice(at, 1);
    doc.selectedLayerId = this.previousSelection;
  }
}

export class RemoveLayer implements Command {
  private removed: Layer | null = null;
  private at = -1;
  private previousSelection: LayerId | null = null;

  constructor(
    private readonly layerId: LayerId,
    readonly label = "Katmanı sil"
  ) {}

  apply(doc: EditorDocument) {
    const at = layerIndex(doc, this.layerId);
    if (at < 0) return;

    this.at = at;
    this.removed = doc.layers[at];
    this.previousSelection = doc.selectedLayerId;

    doc.layers.splice(at, 1);
    if (doc.selectedLayerId === this.layerId) {
      const fallback = doc.layers[Math.min(at, doc.layers.length - 1)];
      doc.selectedLayerId = fallback ? fallback.id : null;
    }
  }

  revert(doc: EditorDocument) {
    if (!this.removed || this.at < 0) return;
    doc.layers.splice(this.at, 0, this.removed);
    doc.selectedLayerId = this.previousSelection;
  }
}

/** Attaches (or replaces) a layer mask — how every selection becomes permanent. */
export class AttachMask implements Command {
  private previous: Surface | null | undefined;
  private previousEnabled = true;

  constructor(
    private readonly layerId: LayerId,
    private readonly mask: Surface,
    readonly label = "Maske uygula"
  ) {}

  apply(doc: EditorDocument) {
    const layer = findLayer(doc, this.layerId);
    if (!layer) return;

    if (this.previous === undefined) {
      this.previous = layer.mask;
      this.previousEnabled = layer.maskEnabled;
    }

    layer.mask = this.mask;
    layer.maskEnabled = true;
  }

  revert(doc: EditorDocument) {
    const layer = findLayer(doc, this.layerId);
    if (!layer || this.previous === undefined) return;
    layer.mask = this.previous;
    layer.maskEnabled = this.previousEnabled;
  }
}

/**
 * Several commands as one history step. Applying a selection can mean both
 * attaching a mask and writing into it; a person undoing that expects one
 * press to put things back, not two.
 */
export class CompositeCommand implements Command {
  constructor(
    readonly label: string,
    private readonly commands: Command[]
  ) {}

  apply(doc: EditorDocument) {
    for (const command of this.commands) command.apply(doc);
  }

  revert(doc: EditorDocument) {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].revert(doc);
    }
  }
}
