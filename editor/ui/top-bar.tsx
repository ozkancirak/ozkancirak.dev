"use client";

import Link from "next/link";
import { ChevronLeft, Redo2, Undo2 } from "lucide-react";
import { useEditor, useEditorVersion } from "@/editor/state/editor-context";
import { ExportMenu } from "./export-menu";

const iconButton =
  "grid size-[1.875rem] place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:text-muted-foreground/35";

export function TopBar({ onError }: { onError: (message: string) => void }) {
  useEditorVersion();
  const editor = useEditor();

  const { canUndo, canRedo, undoLabel, redoLabel } = editor.history;

  return (
    <header className="flex items-center gap-3.5 border-b border-border bg-card pr-3 pl-3.5">
      <Link
        href="/"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md py-1.5 pr-2 pl-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
        portfolio.dev
      </Link>

      <span aria-hidden className="h-4 w-px shrink-0 bg-border" />

      <span className="truncate font-semibold tracking-tight">
        {editor.document?.name ?? "Başlıksız"}
      </span>

      <span className="flex-1" />

      <button
        type="button"
        disabled={!canUndo}
        onClick={() => editor.undo()}
        aria-label="Geri al"
        title={undoLabel ? `Geri al: ${undoLabel} (Ctrl+Z)` : "Geri al (Ctrl+Z)"}
        className={iconButton}
      >
        <Undo2 className="size-4" />
      </button>
      <button
        type="button"
        disabled={!canRedo}
        onClick={() => editor.redo()}
        aria-label="İleri al"
        title={redoLabel ? `İleri al: ${redoLabel} (Ctrl+Shift+Z)` : "İleri al (Ctrl+Shift+Z)"}
        className={iconButton}
      >
        <Redo2 className="size-4" />
      </button>

      <span aria-hidden className="h-4 w-px shrink-0 bg-border" />

      <ExportMenu onError={onError} />
    </header>
  );
}
