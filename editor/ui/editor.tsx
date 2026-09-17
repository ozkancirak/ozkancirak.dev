"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { documentFromImage, findLayer, selectedLayer } from "@/editor/core/document";
import type { View } from "@/editor/gl/compositor";
import { maxTextureSize } from "@/editor/gl/limits";
import {
  decodeImage,
  documentNameFor,
  firstImageFromClipboard,
} from "@/editor/io/decode";
import { EditorProvider, useEditor } from "@/editor/state/editor-context";
import { eraseSelection } from "@/editor/tools/apply-selection";
import {
  availableTools,
  defaultTool,
  initialOptionState,
  optionKey,
  tools,
  type ToolId,
} from "@/editor/tools/registry";
import { ImagingClient } from "@/editor/tools/imaging-client";
import { ContextBar } from "./context-bar";
import { Notice } from "./notice";
import { SidePanel } from "./side-panel";
import { Stage } from "./stage";
import { StatusBar } from "./status-bar";
import { ToolRail } from "./tool-rail";
import { TopBar } from "./top-bar";

export function Editor() {
  return (
    <EditorProvider>
      <Workspace />
    </EditorProvider>
  );
}

function Workspace() {
  const editor = useEditor();
  const [activeTool, setActiveTool] = useState<ToolId>(defaultTool);
  const [options, setOptions] = useState(initialOptionState);
  const [view, setView] = useState<View>({ zoom: 1, panX: 0, panY: 0 });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refineRadius, setRefineRadius] = useState(12);

  const [imaging] = useState(() => new ImagingClient());
  useEffect(() => () => imaging.dispose(), [imaging]);

  /** Where the live wand selection was seeded, so its settings can re-run it. */
  const seedRef = useRef<{ x: number; y: number; layerId: string } | null>(null);

  const tool = tools.find((t) => t.id === activeTool) ?? tools[0];

  const setOption = useCallback((key: string, value: number | boolean) => {
    setOptions((previous) => ({ ...previous, [key]: value }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setView((previous) => ({ ...previous, zoom }));
  }, []);

  const openFile = useCallback(
    async (file: File) => {
      try {
        const image = await decodeImage(file);
        const limit = maxTextureSize();

        if (image.width > limit || image.height > limit) {
          setNotice(
            `Görsel ${image.width}×${image.height} — bu GPU en fazla ${limit} piksel kenar destekliyor.`
          );
          return;
        }

        editor.open(documentFromImage(documentNameFor(file), image));
        setNotice(null);
      } catch (cause) {
        setNotice(
          cause instanceof Error ? cause.message : "Görsel açılamadı."
        );
      }
    },
    [editor]
  );

  const pick = useCallback(
    async (x: number, y: number) => {
      const document = editor.document;
      if (!document || busy) return;
      if (activeTool !== "wand" && activeTool !== "eraser") return;

      const layer = selectedLayer(document) ?? document.layers.at(-1);
      if (!layer) return;

      const tolerance = Number(options[optionKey(activeTool, "tolerance")] ?? 30);
      const contiguous = Boolean(
        options[optionKey(activeTool, "contiguous")] ?? true
      );

      setBusy(true);
      try {
        const selection = await imaging.select(layer.id, layer.surface, {
          seedX: x,
          seedY: y,
          tolerance,
          contiguous,
        });

        if (!selection.bounds || selection.selected === 0) {
          setNotice("Bu toleransta hiçbir piksel seçilmedi. Toleransı artırmayı dene.");
          return;
        }

        // The wand proposes; the eraser commits. Keeping them apart is what
        // lets the tolerance be dialled in against a visible outline before
        // anything is written to the mask.
        if (activeTool === "wand") {
          seedRef.current = { x, y, layerId: layer.id };
          editor.setSelection({
            coverage: selection.coverage,
            bounds: selection.bounds,
            selected: selection.selected,
          });
          return;
        }

        editor.run(
          eraseSelection(document, layer, selection.coverage, selection.bounds)
        );
        editor.setSelection(null);
        seedRef.current = null;
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : "Seçim başarısız oldu.");
      } finally {
        setBusy(false);
      }
    },
    [editor, imaging, options, activeTool, busy]
  );

  const wandTolerance = Number(options[optionKey("wand", "tolerance")] ?? 32);
  const wandContiguous = Boolean(options[optionKey("wand", "contiguous")] ?? true);

  // Re-run the live selection as its settings change. This is what the worker
  // caches pixels for: dragging tolerance sends three numbers, not a layer.
  useEffect(() => {
    if (activeTool !== "wand") return;

    const seed = seedRef.current;
    const document = editor.document;
    if (!seed || !document) return;

    const layer = findLayer(document, seed.layerId);
    if (!layer) return;

    let cancelled = false;
    imaging
      .select(seed.layerId, layer.surface, {
        seedX: seed.x,
        seedY: seed.y,
        tolerance: wandTolerance,
        contiguous: wandContiguous,
      })
      .then((selection) => {
        if (cancelled) return;
        editor.setSelection(
          selection.bounds
            ? {
                coverage: selection.coverage,
                bounds: selection.bounds,
                selected: selection.selected,
              }
            : null
        );
      })
      .catch(() => {
        // A superseded run losing its race is not worth reporting.
      });

    return () => {
      cancelled = true;
    };
  }, [wandTolerance, wandContiguous, activeTool, editor, imaging]);

  const applySelection = useCallback(() => {
    const document = editor.document;
    const selection = editor.selection;
    if (!document || !selection) return false;

    const layer = selectedLayer(document) ?? document.layers.at(-1);
    if (!layer) return false;

    editor.run(
      eraseSelection(document, layer, selection.coverage, selection.bounds)
    );
    editor.setSelection(null);
    seedRef.current = null;
    return true;
  }, [editor]);

  /** Epsilon stays fixed: smaller keeps the cut crisp, and it is not a dial
   *  anyone would know how to set. Radius is the one that maps to something
   *  visible — how far around the boundary to look. */
  const REFINE_EPSILON = 1e-5;

  const refineEdges = useCallback(async () => {
    const document = editor.document;
    const selection = editor.selection;
    if (!document || !selection || refining) return;

    const layer = selectedLayer(document) ?? document.layers.at(-1);
    if (!layer) return;

    setRefining(true);
    try {
      const refined = await imaging.refine(
        layer.id,
        layer.surface,
        selection.coverage,
        { radius: refineRadius, epsilon: REFINE_EPSILON }
      );

      // Refinement can push coverage past the original bounds, so the box is
      // widened by the radius rather than reused as-is.
      const pad = refineRadius;
      editor.setSelection({
        coverage: refined.coverage,
        bounds: {
          x: Math.max(0, selection.bounds.x - pad),
          y: Math.max(0, selection.bounds.y - pad),
          width: Math.min(
            document.width - Math.max(0, selection.bounds.x - pad),
            selection.bounds.width + pad * 2
          ),
          height: Math.min(
            document.height - Math.max(0, selection.bounds.y - pad),
            selection.bounds.height + pad * 2
          ),
        },
        selected: selection.selected,
      });
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Kenar iyileştirilemedi.");
    } finally {
      setRefining(false);
    }
  }, [editor, imaging, refineRadius, refining]);

  const clearSelection = useCallback(() => {
    if (!editor.selection) return false;
    editor.setSelection(null);
    seedRef.current = null;
    return true;
  }, [editor]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = firstImageFromClipboard(event.clipboardData);
      if (!file) return;
      event.preventDefault();
      void openFile(file);
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [openFile]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, [contenteditable]")) return;

      const accel = event.metaKey || event.ctrlKey;

      if (event.key === "Delete" || event.key === "Backspace") {
        if (applySelection()) event.preventDefault();
        return;
      }

      if (event.key === "Escape" || (accel && event.key.toLowerCase() === "d")) {
        if (clearSelection()) event.preventDefault();
        return;
      }

      if (accel && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) editor.redo();
        else editor.undo();
        return;
      }

      // Windows' other redo binding.
      if (accel && event.key.toLowerCase() === "y") {
        event.preventDefault();
        editor.redo();
        return;
      }

      // Single-key tool shortcuts, the way every editor does it. Modifier
      // combos stay free for the app's own bindings.
      if (accel || event.altKey) return;

      const match = availableTools.find(
        (t) => t.shortcut.toLowerCase() === event.key.toLowerCase()
      );
      if (!match) return;

      event.preventDefault();
      setActiveTool(match.id);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, applySelection, clearSelection]);

  return (
    /*
      `dark` is carried on this element rather than inherited from <html>, so
      the editor stays dark even when the site is toggled to light. The
      utilities below read the tokens the .dark block redefines (bg-card,
      border-border, …) rather than `dark:` variants — those key off an
      ancestor, which this element is not.
    */
    <div className="dark grid h-dvh grid-rows-[3rem_minmax(0,1fr)_2rem] overflow-hidden bg-background text-foreground">
      <TopBar onError={setNotice} />

      <div className="grid min-h-0 grid-cols-[3rem_minmax(0,1fr)] lg:grid-cols-[3rem_minmax(0,1fr)_16.5rem]">
        <ToolRail active={activeTool} onSelect={setActiveTool} />

        <div className="grid min-w-0 grid-rows-[2.25rem_minmax(0,1fr)]">
          <ContextBar tool={tool} values={options} onChange={setOption} />
          <Stage
            view={view}
            onViewChange={setView}
            onOpenFile={(file) => void openFile(file)}
            onPick={(x, y) => void pick(x, y)}
            handTool={activeTool === "hand"}
          />
        </div>

        <SidePanel
          canRefine={editor.selection !== null}
          refining={refining}
          refineRadius={refineRadius}
          onRefineRadius={setRefineRadius}
          onRefine={() => void refineEdges()}
        />
      </div>

      <StatusBar zoom={view.zoom} onZoom={setZoom} />

      <Notice message={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
