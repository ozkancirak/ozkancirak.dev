"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, TriangleAlert } from "lucide-react";
import type { View } from "@/editor/gl/compositor";
import { firstImage, SUPPORTED_TYPES } from "@/editor/io/decode";
import { useEditor, useEditorVersion } from "@/editor/state/editor-context";
import { cn } from "@/lib/utils";
import { useCompositor } from "./use-compositor";

const MIN_ZOOM = 0.02;
const MAX_ZOOM = 32;
/** Leaves a margin around a fitted document so it does not touch the chrome. */
const FIT_MARGIN = 0.9;

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function Stage({
  view,
  onViewChange,
  onOpenFile,
  onPick,
  handTool,
}: {
  view: View;
  onViewChange: (view: View) => void;
  onOpenFile: (file: File) => void;
  onPick: (x: number, y: number) => void;
  handTool: boolean;
}) {
  const editor = useEditor();
  const version = useEditorVersion();

  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { error } = useCompositor(canvasRef, view);

  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const [dropping, setDropping] = useState(false);
  const fittedRef = useRef<object | null>(null);

  const document = editor.document;
  const panMode = handTool || spaceHeld;

  // Space is the universal hold-to-pan binding; track it globally so it works
  // wherever focus happens to be.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, [contenteditable]")) return;
      e.preventDefault();
      setSpaceHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    const blur = () => setSpaceHeld(false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  // Frame a freshly opened document. Keyed on the document object itself, so
  // reopening the same file refits but an edit does not.
  useEffect(() => {
    const host = hostRef.current;
    if (!document || !host || fittedRef.current === document) return;

    fittedRef.current = document;
    const box = host.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    onViewChange({
      zoom: clampZoom(
        Math.min(box.width / document.width, box.height / document.height) *
          FIT_MARGIN
      ),
      panX: 0,
      panY: 0,
    });
  }, [document, version, onViewChange]);

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      if (!document) return;

      const host = hostRef.current;
      if (!host) return;

      // Trackpad pinch arrives as ctrl+wheel, which is why this is the zoom
      // gesture rather than plain wheel.
      if (!event.ctrlKey && !event.metaKey) {
        onViewChange({
          ...view,
          panX: view.panX - event.deltaX,
          panY: view.panY - event.deltaY,
        });
        return;
      }

      const box = host.getBoundingClientRect();
      const cursorX = event.clientX - box.left - box.width / 2;
      const cursorY = event.clientY - box.top - box.height / 2;

      const next = clampZoom(view.zoom * Math.exp(-event.deltaY * 0.002));
      const ratio = next / view.zoom;

      // Keep whatever sits under the cursor pinned there.
      onViewChange({
        zoom: next,
        panX: cursorX - (cursorX - view.panX) * ratio,
        panY: cursorY - (cursorY - view.panY) * ratio,
      });
    },
    [document, view, onViewChange]
  );

  const onPointerDown = (event: React.PointerEvent) => {
    if (!document) return;

    const middleButton = event.button === 1;
    if (panMode || middleButton) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setPanning(true);
      return;
    }

    if (event.button !== 0) return;

    const host = hostRef.current;
    if (!host) return;

    // Undo the view transform: screen point back to document pixels.
    const box = host.getBoundingClientRect();
    const relX = event.clientX - box.left - box.width / 2;
    const relY = event.clientY - box.top - box.height / 2;

    const x = Math.floor(document.width / 2 + (relX - view.panX) / view.zoom);
    const y = Math.floor(document.height / 2 + (relY - view.panY) / view.zoom);

    if (x < 0 || y < 0 || x >= document.width || y >= document.height) return;
    onPick(x, y);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!panning) return;
    onViewChange({
      ...view,
      panX: view.panX + event.movementX,
      panY: view.panY + event.movementY,
    });
  };

  const endPan = (event: React.PointerEvent) => {
    if (!panning) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setPanning(false);
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDropping(false);
    const file = firstImage(event.dataTransfer?.files ?? null);
    if (file) onOpenFile(file);
  };

  return (
    <div
      ref={hostRef}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onDragOver={(e) => {
        e.preventDefault();
        setDropping(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDropping(false);
      }}
      onDrop={onDrop}
      className={cn(
        "relative min-h-0 overflow-hidden bg-background",
        panning ? "cursor-grabbing" : panMode ? "cursor-grab" : "cursor-default"
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block size-full" />

      {error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
          <div className="flex max-w-sm items-start gap-3 rounded-xl border border-border bg-card p-4">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold">Görüntüleyici başlatılamadı</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {!document && !error && <EmptyState onOpenFile={onOpenFile} />}

      {dropping && (
        <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-500/5" />
      )}
    </div>
  );
}

function EmptyState({ onOpenFile }: { onOpenFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-12 py-10 text-center transition-colors hover:border-input hover:bg-card"
      >
        <ImagePlus className="size-6 text-muted-foreground/60" />
        <span>
          <span className="block font-semibold">Bir görsel sürükleyip bırak</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            PNG, JPG veya WebP · panodan yapıştırabilirsin
          </span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onOpenFile(file);
          // Lets the same file be picked twice in a row.
          e.target.value = "";
        }}
      />
    </div>
  );
}
