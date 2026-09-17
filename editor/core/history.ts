import type { Command } from "./commands";
import type { EditorDocument } from "./document";

/**
 * Linear undo. A redo stack survives only until the next new command, which is
 * the behaviour every editor has trained people to expect.
 */
export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  constructor(private readonly limit = 200) {}

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  get undoLabel(): string | null {
    return this.undoStack.at(-1)?.label ?? null;
  }

  get redoLabel(): string | null {
    return this.redoStack.at(-1)?.label ?? null;
  }

  run(doc: EditorDocument, command: Command) {
    command.apply(doc);
    this.undoStack.push(command);

    // Oldest steps fall off the bottom; each one holds pixel snapshots, so an
    // unbounded stack is an unbounded memory leak.
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  undo(doc: EditorDocument): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;

    command.revert(doc);
    this.redoStack.push(command);
    return true;
  }

  redo(doc: EditorDocument): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;

    command.apply(doc);
    this.undoStack.push(command);
    return true;
  }

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
