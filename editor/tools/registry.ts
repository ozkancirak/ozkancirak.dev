// The tool set for Faz 1. Only tools that actually work are listed — a greyed
// out button that does nothing costs more trust than the feature is worth.

import { Brush, Eraser, Hand, Wand2 } from "lucide-react";

export type ToolId = "wand" | "eraser" | "brush" | "hand";

export type ToolOption =
  | {
      kind: "range";
      id: string;
      label: string;
      min: number;
      max: number;
      value: number;
      unit?: string;
    }
  | { kind: "toggle"; id: string; label: string; value: boolean }
  | { kind: "select"; id: string; label: string; items: string[]; value: number };

export type Tool = {
  id: ToolId;
  name: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
  /**
   * Only available tools reach the rail. A button that does nothing costs more
   * trust than the feature is worth, so tools appear as they start working
   * rather than sitting greyed out.
   */
  available: boolean;
  /**
   * Only this tool's own options ever reach the context bar. This is the one
   * deliberate departure from Photoshop, whose option bar carries every tool's
   * settings at once.
   */
  options: ToolOption[];
};

export const tools: Tool[] = [
  {
    id: "wand",
    name: "Sihirli değnek",
    shortcut: "W",
    icon: Wand2,
    available: true,
    options: [
      { kind: "range", id: "tolerance", label: "Tolerans", min: 0, max: 100, value: 32 },
      { kind: "toggle", id: "contiguous", label: "Bitişik", value: true },
      { kind: "toggle", id: "sampleAll", label: "Tüm katmanlardan örnekle", value: false },
      {
        kind: "select",
        id: "edge",
        label: "Kenar",
        items: ["Yumuşak", "Keskin", "Saç (guided)"],
        value: 0,
      },
    ],
  },
  {
    id: "eraser",
    name: "Sihirli silgi",
    shortcut: "E",
    icon: Eraser,
    available: true,
    options: [
      { kind: "range", id: "tolerance", label: "Tolerans", min: 0, max: 100, value: 28 },
      { kind: "toggle", id: "contiguous", label: "Bitişik", value: true },
      {
        kind: "select",
        id: "edge",
        label: "Kenar",
        items: ["Saç (guided)", "Yumuşak", "Keskin"],
        value: 0,
      },
    ],
  },
  {
    id: "brush",
    name: "Maske fırçası",
    shortcut: "B",
    icon: Brush,
    available: false,
    options: [
      { kind: "range", id: "size", label: "Boyut", min: 1, max: 400, value: 48, unit: "px" },
      { kind: "range", id: "hardness", label: "Sertlik", min: 0, max: 100, value: 65, unit: "%" },
      { kind: "select", id: "mode", label: "Mod", items: ["Göster", "Gizle"], value: 1 },
    ],
  },
  { id: "hand", name: "Kaydır", shortcut: "H", icon: Hand, available: true, options: [] },
];

/** What the rail shows and the shortcuts reach. */
export const availableTools: Tool[] = tools.filter((tool) => tool.available);

export const defaultTool: ToolId = "eraser";

/** Flat key for a tool's option value, e.g. `wand.tolerance`. */
export function optionKey(toolId: ToolId, optionId: string) {
  return `${toolId}.${optionId}`;
}

export function initialOptionState(): Record<string, number | boolean> {
  const state: Record<string, number | boolean> = {};
  for (const tool of tools) {
    for (const option of tool.options) {
      state[optionKey(tool.id, option.id)] = option.value;
    }
  }
  return state;
}
