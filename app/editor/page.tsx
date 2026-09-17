import type { Metadata } from "next";
import { EditorShell } from "./editor-shell";

// Deliberately outside the (site) route group: no header, no footer, no bottom
// fade — the editor owns the whole viewport.
export const metadata: Metadata = {
  title: "Editör",
  description: "Tarayıcıda çalışan görsel editör.",
  alternates: { canonical: "/editor" },
  // A personal tool, not a page worth indexing.
  robots: { index: false, follow: false },
};

export default function EditorPage() {
  return <EditorShell />;
}
