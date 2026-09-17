"use client";

import { useEffect, useRef } from "react";
import type { Surface } from "@/editor/core/surface";

/** Rendered at 2x so the 34px square stays crisp on dense displays. */
const PIXELS = 68;

export function LayerThumbnail({
  surface,
  className,
}: {
  surface: Surface;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const revision = surface.revision;

  useEffect(() => {
    const context = ref.current?.getContext("2d");
    if (!context) return;

    const scale = Math.min(PIXELS / surface.width, PIXELS / surface.height);
    const width = Math.max(1, Math.round(surface.width * scale));
    const height = Math.max(1, Math.round(surface.height * scale));

    context.clearRect(0, 0, PIXELS, PIXELS);
    context.putImageData(
      surface.thumbnail(width, height),
      Math.floor((PIXELS - width) / 2),
      Math.floor((PIXELS - height) / 2)
    );
    // `revision` is the dependency that matters — it changes whenever the
    // surface's pixels do.
  }, [surface, revision]);

  return <canvas ref={ref} width={PIXELS} height={PIXELS} className={className} />;
}
