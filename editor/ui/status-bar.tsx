"use client";

import { Minus, Plus } from "lucide-react";
import { useEditor, useEditorVersion } from "@/editor/state/editor-context";

const ZOOM_STEPS = [0.12, 0.25, 0.33, 0.5, 0.67, 1, 1.5, 2, 3] as const;

export function StatusBar({
  zoom,
  onZoom,
}: {
  zoom: number;
  onZoom: (zoom: number) => void;
}) {
  useEditorVersion();
  const editor = useEditor();
  const document = editor.document;
  const selection = editor.selection;

  // The wheel produces continuous zoom, so these buttons cannot look the
  // current value up in the table — they step to the nearest one past it.
  const step = (direction: 1 | -1) => {
    const epsilon = 1e-4;

    if (direction === 1) {
      const next = ZOOM_STEPS.find((value) => value > zoom + epsilon);
      onZoom(next ?? ZOOM_STEPS[ZOOM_STEPS.length - 1]);
      return;
    }

    const lower = ZOOM_STEPS.filter((value) => value < zoom - epsilon);
    onZoom(lower.length ? lower[lower.length - 1] : ZOOM_STEPS[0]);
  };

  return (
    <footer className="flex items-center gap-3.5 border-t border-border bg-card pr-3 pl-3.5 text-xs text-muted-foreground/80">
      {/* Tabular figures throughout: dimensions and zoom must not reflow as
          they change. */}
      <span className="font-mono tabular-nums">
        {document ? `${document.width} × ${document.height}` : "—"}
      </span>
      <span aria-hidden className="h-3.5 w-px bg-border" />
      <span>RGB · 8 bit</span>

      <span className="flex-1" />

      {selection && (
        <>
          <span className="font-mono tabular-nums">
            Seçim: {(selection.selected / 1_000_000).toFixed(2)} MP
          </span>
          <span aria-hidden className="h-3.5 w-px bg-border" />
        </>
      )}

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Uzaklaştır"
          className="grid size-5.5 place-items-center rounded-sm transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="min-w-10 text-center font-mono tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Yakınlaştır"
          className="grid size-5.5 place-items-center rounded-sm transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </footer>
  );
}
