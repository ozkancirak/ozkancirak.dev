"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { EditorStore } from "./store";

const EditorContext = createContext<EditorStore | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  // Lazy initialiser rather than a ref: the store must be created once, and
  // reading a ref during render is not allowed.
  const [store] = useState(() => new EditorStore());

  return (
    <EditorContext.Provider value={store}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): EditorStore {
  const store = useContext(EditorContext);
  if (!store) throw new Error("useEditor must be used inside <EditorProvider>");
  return store;
}

/**
 * Subscribes to document mutations. Returns the version counter, which callers
 * normally ignore — its job is to re-render so they can read the store again.
 */
export function useEditorVersion(): number {
  const store = useEditor();
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
}
