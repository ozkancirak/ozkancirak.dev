"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * A single transient message, floated over the stage. Errors here are things
 * the person can act on — a file that will not decode, an image the GPU cannot
 * hold — so they say what happened rather than apologising.
 */
export function Notice({
  message,
  onDismiss,
  timeout = 6000,
}: {
  message: string | null;
  onDismiss: () => void;
  timeout?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onDismiss, timeout);
    return () => window.clearTimeout(id);
  }, [message, onDismiss, timeout]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-12 z-50 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border border-border bg-popover px-4 py-3 shadow-xl">
        <p className="text-xs leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Kapat"
          className="-mt-0.5 -mr-1 grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
