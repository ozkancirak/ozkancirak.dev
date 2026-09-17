"use client";

import { optionKey, type Tool, type ToolOption } from "@/editor/tools/registry";
import { cn } from "@/lib/utils";

type Values = Record<string, number | boolean>;

/**
 * Renders the options of the active tool and nothing else. Photoshop's option
 * bar carries every tool's settings at once; keeping this bar scoped is what
 * lets it stay one thin row.
 */
export function ContextBar({
  tool,
  values,
  onChange,
}: {
  tool: Tool;
  values: Values;
  onChange: (key: string, value: number | boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto border-b border-border px-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="shrink-0 text-[0.6875rem] font-semibold tracking-[0.09em] text-muted-foreground/70 uppercase">
        {tool.name}
      </span>

      {tool.options.length === 0 ? (
        <span className="shrink-0 text-muted-foreground/70">Ayar yok</span>
      ) : (
        tool.options.map((option) => (
          <Option
            key={option.id}
            option={option}
            value={values[optionKey(tool.id, option.id)]}
            onChange={(value) => onChange(optionKey(tool.id, option.id), value)}
          />
        ))
      )}
    </div>
  );
}

function Option({
  option,
  value,
  onChange,
}: {
  option: ToolOption;
  value: number | boolean;
  onChange: (value: number | boolean) => void;
}) {
  const id = `opt-${option.id}`;

  if (option.kind === "range") {
    const current = typeof value === "number" ? value : option.value;
    return (
      <div className="flex shrink-0 items-center gap-2">
        <label htmlFor={id} className="text-muted-foreground">
          {option.label}
        </label>
        <input
          id={id}
          type="range"
          min={option.min}
          max={option.max}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-[3px] w-24 cursor-pointer appearance-none rounded-full bg-secondary accent-foreground"
        />
        <span className="min-w-7 font-mono text-[0.6875rem] tabular-nums">
          {current}
          {option.unit ?? ""}
        </span>
      </div>
    );
  }

  if (option.kind === "toggle") {
    const checked = typeof value === "boolean" ? value : option.value;
    return (
      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-muted-foreground">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            "size-[0.9375rem] cursor-pointer appearance-none rounded-[4px] border border-input bg-secondary transition-colors",
            "checked:border-emerald-500 checked:bg-emerald-500",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          )}
        />
        {option.label}
      </label>
    );
  }

  const selected = typeof value === "number" ? value : option.value;
  return (
    <div className="flex shrink-0 items-center gap-2">
      <label htmlFor={id} className="text-muted-foreground">
        {option.label}
      </label>
      <select
        id={id}
        value={selected}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 cursor-pointer rounded-sm border border-border bg-secondary px-1.5 text-xs"
      >
        {option.items.map((item, index) => (
          <option key={item} value={index}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
