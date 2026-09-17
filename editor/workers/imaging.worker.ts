/// <reference lib="webworker" />

import { floodFill } from "@/editor/tools/flood-fill";
import { guidedFilter } from "@/editor/tools/guided-filter";
import type { Rect } from "@/editor/core/geometry";

type LoadMessage = {
  type: "load";
  sourceId: string;
  revision: number;
  pixels: ArrayBuffer;
  width: number;
  height: number;
};

type RefineMessage = {
  type: "refine";
  id: number;
  sourceId: string;
  coverage: ArrayBuffer;
  radius: number;
  epsilon: number;
};

type FillMessage = {
  type: "fill";
  id: number;
  sourceId: string;
  seedX: number;
  seedY: number;
  tolerance: number;
  contiguous: boolean;
};

export type WorkerRequest = LoadMessage | FillMessage | RefineMessage;

export type WorkerResponse =
  | {
      type: "result";
      id: number;
      coverage: ArrayBuffer;
      bounds: Rect | null;
      selected: number;
    }
  | { type: "error"; id: number; message: string };

type Source = {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  revision: number;
};

/**
 * Pixels are kept here between operations. Dragging the tolerance slider
 * re-runs the fill on every frame, and re-sending a 24-megapixel buffer each
 * time would cost more than the work itself. Edge refinement reads the same
 * cache — it needs those exact pixels as its guide.
 */
const sources = new Map<string, Source>();

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  if (message.type === "load") {
    sources.set(message.sourceId, {
      pixels: new Uint8ClampedArray(message.pixels),
      width: message.width,
      height: message.height,
      revision: message.revision,
    });
    return;
  }

  const source = sources.get(message.sourceId);
  if (!source) {
    const response: WorkerResponse = {
      type: "error",
      id: message.id,
      message: "Kaynak görüntü worker tarafında bulunamadı.",
    };
    self.postMessage(response);
    return;
  }

  try {
    if (message.type === "refine") {
      const refined = guidedFilter(
        source.pixels,
        new Uint8ClampedArray(message.coverage),
        source.width,
        source.height,
        { radius: message.radius, epsilon: message.epsilon }
      );

      const response: WorkerResponse = {
        type: "result",
        id: message.id,
        coverage: refined.buffer as ArrayBuffer,
        bounds: null,
        selected: 0,
      };
      self.postMessage(response, [response.coverage]);
      return;
    }

    const result = floodFill({
      pixels: source.pixels,
      width: source.width,
      height: source.height,
      seedX: message.seedX,
      seedY: message.seedY,
      tolerance: message.tolerance,
      contiguous: message.contiguous,
    });

    const response: WorkerResponse = {
      type: "result",
      id: message.id,
      coverage: result.coverage.buffer as ArrayBuffer,
      bounds: result.bounds,
      selected: result.selected,
    };
    self.postMessage(response, [response.coverage]);
  } catch (cause) {
    const response: WorkerResponse = {
      type: "error",
      id: message.id,
      message: cause instanceof Error ? cause.message : String(cause),
    };
    self.postMessage(response);
  }
};
