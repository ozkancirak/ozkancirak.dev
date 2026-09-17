import {
  AttachMask,
  CompositeCommand,
  WritePixels,
  type Command,
} from "@/editor/core/commands";
import { createMask, type EditorDocument, type Layer } from "@/editor/core/document";
import type { Rect } from "@/editor/core/geometry";

/**
 * Turns a coverage field into a mask edit.
 *
 * Nothing is deleted: the pixels stay, the mask hides them. That is the whole
 * argument for this tool over the one it replaces — the cutout is still a
 * cutout tomorrow, and a brush can put any of it back.
 */
export function eraseSelection(
  document: EditorDocument,
  layer: Layer,
  coverage: Uint8ClampedArray,
  bounds: Rect,
  label = "Sihirli silgi"
): Command {
  const commands: Command[] = [];
  let mask = layer.mask;

  if (!mask) {
    mask = createMask(document.width, document.height);
    commands.push(new AttachMask(layer.id, mask, label));
  }

  const before = mask.read(bounds);
  const after = new ImageData(bounds.width, bounds.height);

  for (let y = 0; y < bounds.height; y++) {
    for (let x = 0; x < bounds.width; x++) {
      const local = (y * bounds.width + x) * 4;
      const source = (bounds.y + y) * document.width + (bounds.x + x);

      // Erasing only ever takes coverage away, so repeated clicks accumulate
      // instead of undoing each other.
      const value = Math.min(before.data[local], 255 - coverage[source]);

      after.data[local] = value;
      after.data[local + 1] = value;
      after.data[local + 2] = value;
      after.data[local + 3] = 255;
    }
  }

  commands.push(new WritePixels(layer.id, "mask", bounds, after, label));

  return commands.length === 1
    ? commands[0]
    : new CompositeCommand(label, commands);
}
