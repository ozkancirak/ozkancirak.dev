"use client";

import { availableTools, type ToolId } from "@/editor/tools/registry";
import { cn } from "@/lib/utils";

export function ToolRail({
  active,
  onSelect,
}: {
  active: ToolId;
  onSelect: (id: ToolId) => void;
}) {
  return (
    <nav
      aria-label="Araçlar"
      className="flex flex-col items-center gap-0.5 border-r border-border bg-card py-2"
    >
      {availableTools.map((tool) => {
        const Icon = tool.icon;
        const selected = tool.id === active;

        return (
          <button
            key={tool.id}
            type="button"
            aria-pressed={selected}
            aria-label={tool.name}
            title={`${tool.name} (${tool.shortcut})`}
            onClick={() => onSelect(tool.id)}
            className={cn(
              "grid size-[2.125rem] place-items-center rounded-md transition-colors",
              selected
                ? "bg-emerald-500/15 text-emerald-400"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="size-4.5" />
          </button>
        );
      })}
    </nav>
  );
}
