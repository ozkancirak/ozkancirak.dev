"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Compositor, type View } from "@/editor/gl/compositor";
import { useEditor, useEditorVersion } from "@/editor/state/editor-context";

/** Dashes travelled per second. Slow enough to read, fast enough to notice. */
const ANT_SPEED = 6;

/**
 * Owns the compositor's lifetime and drives it.
 *
 * Rendering is request-based rather than a standing rAF loop: an editor is
 * idle most of the time, and a loop that redraws a 24-megapixel composite
 * sixty times a second for no reason is exactly the kind of thing that makes a
 * laptop fan audible. The one exception is a live selection, whose marching
 * ants have to keep moving — and that loop stops the moment it is dismissed.
 */
export function useCompositor(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  view: View
) {
  const editor = useEditor();
  const version = useEditorVersion();

  const compositorRef = useRef<Compositor | null>(null);
  const viewRef = useRef(view);
  const frameRef = useRef(0);
  const loopRef = useRef(0);
  const [error, setError] = useState<string | null>(null);

  const draw = useCallback(
    (time: number) => {
      const document = editor.document;
      const selection = editor.selection;

      // Coverage is always document-sized, so the overlay's dimensions come
      // from the document rather than being stored twice. The compositor keys
      // its upload on the coverage buffer's identity, not this wrapper, so
      // rebuilding it per frame costs nothing.
      compositorRef.current?.render(
        document,
        viewRef.current,
        selection && document
          ? {
              coverage: selection.coverage,
              width: document.width,
              height: document.height,
            }
          : null,
        time
      );
    },
    [editor]
  );

  const requestRender = useCallback(() => {
    if (frameRef.current || loopRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      draw(0);
    });
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    let compositor: Compositor | null = null;
    let observer: ResizeObserver | null = null;

    const fit = () => {
      if (!compositor) return;
      const box = host.getBoundingClientRect();
      compositor.resize(box.width, box.height, window.devicePixelRatio || 1);
      requestRender();
    };

    // Construction happens on the first frame rather than in the effect body,
    // so a failure is reported from an external callback instead of a
    // synchronous setState that would cascade a render.
    const start = requestAnimationFrame(() => {
      try {
        compositor = new Compositor(canvas);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
        return;
      }

      compositorRef.current = compositor;
      editor.setRenderer(compositor);

      observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        compositor?.resize(width, height, window.devicePixelRatio || 1);
        requestRender();
      });
      observer.observe(host);

      fit();
    });

    // Moving the window between displays changes the device ratio without
    // resizing the element, so the observer alone would leave the canvas soft.
    window.addEventListener("resize", fit);

    return () => {
      cancelAnimationFrame(start);
      observer?.disconnect();
      window.removeEventListener("resize", fit);

      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      frameRef.current = 0;
      loopRef.current = 0;

      editor.setRenderer(null);
      compositor?.dispose();
      compositorRef.current = null;
    };
  }, [canvasRef, requestRender, editor]);

  // A selection animates; everything else is drawn on demand.
  const animating = editor.selection !== null;

  useEffect(() => {
    viewRef.current = view;

    if (!animating) {
      requestRender();
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const started = performance.now();

    const step = () => {
      const elapsed = (performance.now() - started) / 1000;
      draw(reduceMotion ? 0 : elapsed * ANT_SPEED);
      loopRef.current = requestAnimationFrame(step);
    };

    loopRef.current = requestAnimationFrame(step);
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      loopRef.current = 0;
    };
  }, [view, version, animating, draw, requestRender]);

  return { error };
}
