"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ClipboardCopy, Download, Loader2 } from "lucide-react";
import {
  copyToClipboard,
  download,
  encode,
  FORMATS,
  type ExportFormat,
} from "@/editor/io/export";
import { useEditor, useEditorVersion } from "@/editor/state/editor-context";

export function ExportMenu({ onError }: { onError: (message: string) => void }) {
  useEditorVersion();
  const editor = useEditor();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const document = editor.document;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /** Composites at full resolution through the same passes the screen uses. */
  const composite = () => {
    if (!document) return null;

    const image = editor.renderer?.readComposite(document);
    if (!image) {
      onError("Görüntüleyici hazır değil, dışa aktarılamadı.");
      return null;
    }
    return image;
  };

  const saveAs = async (format: ExportFormat) => {
    const spec = FORMATS.find((f) => f.id === format);
    if (!spec || !document || busy) return;

    setBusy(format);
    try {
      const image = composite();
      if (!image) return;

      const blob = await encode(image, format);
      download(blob, `${document.name}.${spec.extension}`);
      setOpen(false);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Dışa aktarma başarısız.");
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (!document || busy) return;

    setBusy("copy");
    try {
      const image = composite();
      if (!image) return;

      await copyToClipboard(image);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Panoya kopyalanamadı.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={!document}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-[1.875rem] items-center gap-1.5 rounded-md bg-foreground px-3 font-semibold text-background transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
      >
        <Download className="size-3.5" />
        Dışa aktar
      </button>

      {open && document && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-52 rounded-xl border border-border bg-popover p-1.5 shadow-xl"
        >
          {FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              role="menuitem"
              disabled={busy !== null}
              onClick={() => void saveAs(format.id)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="font-medium">{format.label}</span>
              <span className="flex items-center gap-1.5">
                {/* Saying this here is cheaper than a support question later. */}
                <span className="text-[0.6875rem] text-muted-foreground/70">
                  {format.alpha ? "şeffaflık korunur" : "beyaza düzleşir"}
                </span>
                {busy === format.id && (
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                )}
              </span>
            </button>
          ))}

          <div className="my-1.5 h-px bg-border" />

          <button
            type="button"
            role="menuitem"
            disabled={busy !== null}
            onClick={() => void copy()}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : busy === "copy" ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <ClipboardCopy className="size-3.5 text-muted-foreground" />
            )}
            {copied ? "Kopyalandı" : "Panoya kopyala"}
          </button>
        </div>
      )}
    </div>
  );
}
