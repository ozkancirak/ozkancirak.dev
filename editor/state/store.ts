import type { Command } from "@/editor/core/commands";
import type { EditorDocument, LayerId } from "@/editor/core/document";
import { History } from "@/editor/core/history";
import type { Rect } from "@/editor/core/geometry";

/**
 * A pending selection: a coverage field over the whole document, plus the box
 * it actually occupies. Deliberately not part of the document — it is a thing
 * you are about to do, not a thing you have done, so it stays out of the undo
 * history and off disk.
 */
/**
 * The bit of the renderer that export needs. Narrow on purpose: the store has
 * no business knowing about WebGL, and export has no business opening a second
 * GL context just to reach a composite that already exists.
 */
export interface DocumentRenderer {
  readComposite(document: EditorDocument): ImageData | null;
}

export type Selection = {
  coverage: Uint8ClampedArray;
  bounds: Rect;
  selected: number;
};

/**
 * Holds the mutable document and its history.
 *
 * The document is mutated in place — copying pixel buffers on every edit is
 * not affordable — so React is told about changes through a version counter
 * rather than by identity. Components read `store.document` directly after
 * subscribing.
 */
export class EditorStore {
  private readonly listeners = new Set<() => void>();
  private version = 0;

  document: EditorDocument | null = null;
  selection: Selection | null = null;
  readonly history = new History();

  /** Set by the stage once its GL context exists. Not rendered state, so no notify. */
  renderer: DocumentRenderer | null = null;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.version;

  /** Call after any mutation that the UI should see. */
  notify() {
    this.version += 1;
    for (const listener of this.listeners) listener();
  }

  open(document: EditorDocument) {
    this.document = document;
    this.selection = null;
    this.history.clear();
    this.notify();
  }

  close() {
    this.document = null;
    this.selection = null;
    this.history.clear();
    this.notify();
  }

  setRenderer(renderer: DocumentRenderer | null) {
    this.renderer = renderer;
  }

  setSelection(selection: Selection | null) {
    if (this.selection === selection) return;
    this.selection = selection;
    this.notify();
  }

  run(command: Command) {
    if (!this.document) return;
    this.history.run(this.document, command);
    this.notify();
  }

  undo() {
    if (this.document && this.history.undo(this.document)) this.notify();
  }

  redo() {
    if (this.document && this.history.redo(this.document)) this.notify();
  }

  /** Selection is navigation, not an edit — deliberately outside the history. */
  selectLayer(id: LayerId | null) {
    if (!this.document || this.document.selectedLayerId === id) return;
    this.document.selectedLayerId = id;
    this.notify();
  }
}
