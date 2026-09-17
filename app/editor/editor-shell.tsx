"use client";

import dynamic from "next/dynamic";

/**
 * The editor is a WebGL/canvas app with no server-rendered form — `ssr: false`
 * keeps Next from trying, and route-level splitting keeps the engine (and the
 * ONNX runtime that lands later) out of the portfolio pages' bundles.
 *
 * `ssr: false` is only legal from a Client Component, which is why this file
 * exists between the route and the editor.
 */
const Editor = dynamic(
  () => import("@/editor/ui/editor").then((m) => m.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="dark grid h-dvh place-items-center bg-background text-sm text-muted-foreground">
        Editör yükleniyor…
      </div>
    ),
  }
);

export function EditorShell() {
  return <Editor />;
}
