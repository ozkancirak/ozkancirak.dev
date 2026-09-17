"use client";

import { Eye, EyeOff, Link2, Loader2, Plus, Scissors, Sparkles } from "lucide-react";
import { SetLayerProperties } from "@/editor/core/commands";
import { layersTopFirst, type BlendMode, type Layer } from "@/editor/core/document";
import { useEditor, useEditorVersion } from "@/editor/state/editor-context";
import { cn } from "@/lib/utils";
import { LayerThumbnail } from "./layer-thumbnail";

const BLEND_LABELS: Record<BlendMode, string> = {
  normal: "Normal",
  multiply: "Çarp",
  screen: "Ekran",
  overlay: "Kaplama",
  darken: "Koyulaştır",
  lighten: "Açıklaştır",
  "color-dodge": "Renk soldur",
  "color-burn": "Renk yak",
  "hard-light": "Sert ışık",
  "soft-light": "Yumuşak ışık",
  difference: "Fark",
  exclusion: "Dışlama",
  hue: "Renk tonu",
  saturation: "Doygunluk",
  color: "Renk",
  luminosity: "Parlaklık",
};

/** Transparency checkerboard, matching the one the stage paints. */
const CHECKER = {
  backgroundColor: "#1a1a1a",
  backgroundImage:
    "linear-gradient(45deg, #242424 25%, transparent 25%, transparent 75%, #242424 75%), linear-gradient(45deg, #242424 25%, transparent 25%, transparent 75%, #242424 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0, 4px 4px",
} satisfies React.CSSProperties;

function SectionHead({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-8.5 items-center justify-between px-3 text-[0.6875rem] font-semibold tracking-[0.09em] text-muted-foreground/70 uppercase">
      {children}
      {action}
    </div>
  );
}

function LayerRow({ layer, selected }: { layer: Layer; selected: boolean }) {
  const editor = useEditor();

  const toggleVisible = (event: React.MouseEvent) => {
    event.stopPropagation();
    editor.run(
      new SetLayerProperties(
        layer.id,
        { visible: !layer.visible },
        layer.visible ? "Katmanı gizle" : "Katmanı göster"
      )
    );
  };

  return (
    <>
      <div
        role="option"
        tabIndex={0}
        aria-selected={selected}
        onClick={() => editor.selectLayer(layer.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            editor.selectLayer(layer.id);
          }
        }}
        className={cn(
          "grid cursor-pointer grid-cols-[1.375rem_2.125rem_minmax(0,1fr)] items-center gap-2 rounded-md p-1.5 transition-colors",
          selected ? "bg-secondary inset-ring inset-ring-input" : "hover:bg-secondary"
        )}
      >
        <button
          type="button"
          onClick={toggleVisible}
          aria-pressed={layer.visible}
          aria-label={layer.visible ? "Katmanı gizle" : "Katmanı göster"}
          className="grid size-5.5 place-items-center rounded-sm text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          {layer.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </button>

        <div
          className="size-[2.125rem] overflow-hidden rounded-sm border border-border"
          style={CHECKER}
        >
          <LayerThumbnail surface={layer.surface} className="size-full" />
        </div>

        <div className="min-w-0">
          <div className="truncate text-[0.8125rem]">{layer.name}</div>
          <div className="font-mono text-[0.6875rem] text-muted-foreground/70 tabular-nums">
            {BLEND_LABELS[layer.blendMode]} · %{Math.round(layer.opacity * 100)}
          </div>
        </div>
      </div>

      {layer.mask && (
        <div className="flex items-center gap-1.5 pt-0.5 pr-1.5 pb-1 pl-[2.125rem] text-[0.6875rem] text-muted-foreground/70">
          <Link2 className="size-3" />
          Katman maskesi
        </div>
      )}
    </>
  );
}

/**
 * Layers over properties, one column. A tabbed panel stack would fit more but
 * costs the calm the rest of the chrome is built around.
 */
export function SidePanel({
  canRefine,
  refining,
  refineRadius,
  onRefineRadius,
  onRefine,
}: {
  canRefine: boolean;
  refining: boolean;
  refineRadius: number;
  onRefineRadius: (radius: number) => void;
  onRefine: () => void;
}) {
  useEditorVersion();
  const editor = useEditor();
  const document = editor.document;
  const layers = document ? layersTopFirst(document) : [];

  return (
    <aside className="hidden min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] border-l border-border bg-card lg:grid">
      <SectionHead
        action={
          <button
            type="button"
            disabled={!document}
            aria-label="Yeni katman"
            className="grid size-5.5 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="size-3.5" />
          </button>
        }
      >
        Katmanlar
      </SectionHead>

      <div role="listbox" aria-label="Katmanlar" className="overflow-y-auto border-t border-border p-1.5">
        {layers.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-relaxed text-muted-foreground/70">
            Henüz katman yok. Bir görsel açtığında burada listelenir.
          </p>
        ) : (
          layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              selected={layer.id === document?.selectedLayerId}
            />
          ))
        )}
      </div>

      <SectionHead>Özellikler</SectionHead>

      <div className="flex flex-col gap-3 overflow-y-auto border-t border-border px-3 pt-2.5 pb-3.5">
        <button
          type="button"
          disabled={!document}
          className="flex h-8.5 w-full items-center justify-center gap-2 rounded-md bg-emerald-500/15 font-semibold text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.22)] transition-colors hover:bg-emerald-500/20 disabled:pointer-events-none disabled:opacity-40"
        >
          <Sparkles className="size-3.5" />
          AI özne seçimi
        </button>

        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground/70">
          Sonuç maskeye yazılır — pikseller silinmez, sonradan fırçayla
          düzeltilebilir.
        </p>

        <div className="mt-1 border-t border-border pt-3">
          <div className="text-[0.6875rem] font-semibold tracking-[0.09em] text-muted-foreground/70 uppercase">
            Kenar
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2.5">
            <label htmlFor="refine-radius" className="text-xs text-muted-foreground">
              Yarıçap
            </label>
            <input
              id="refine-radius"
              type="range"
              min={2}
              max={48}
              value={refineRadius}
              disabled={!canRefine}
              onChange={(e) => onRefineRadius(Number(e.target.value))}
              className="h-[3px] w-24 cursor-pointer appearance-none rounded-full bg-secondary accent-foreground disabled:opacity-40"
            />
            <span className="min-w-8 font-mono text-[0.6875rem] tabular-nums">
              {refineRadius}px
            </span>
          </div>

          <button
            type="button"
            disabled={!canRefine || refining}
            onClick={onRefine}
            className="mt-2.5 flex h-8 w-full items-center justify-center gap-2 rounded-md bg-secondary font-medium transition-colors hover:bg-secondary/70 disabled:pointer-events-none disabled:opacity-40"
          >
            {refining ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Scissors className="size-3.5" />
            )}
            Kenarı iyileştir
          </button>

          <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground/70">
            Seçimin sınırını fotoğrafın kendi kenarına oturtur. Yok olmuş
            detayı geri getirmez.
          </p>
        </div>
      </div>
    </aside>
  );
}
