import type { Rect } from "@/editor/core/geometry";
import type { Surface } from "@/editor/core/surface";
import type {
  WorkerRequest,
  WorkerResponse,
} from "@/editor/workers/imaging.worker";

export type Selection = {
  coverage: Uint8ClampedArray;
  bounds: Rect | null;
  selected: number;
};

type Pending = {
  resolve: (value: Selection) => void;
  reject: (reason: Error) => void;
};

/**
 * Main-thread side of the imaging worker.
 *
 * The worker keeps the pixels it was last given, so adjusting tolerance only
 * sends a few numbers. Without that, every slider frame would ship the whole
 * layer across the thread boundary.
 */
export class ImagingClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  /** Which surface revision the worker currently holds, per source id. */
  private readonly loaded = new Map<string, number>();

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;

    // The specifier has to be a static *relative* path. Bundlers recognise
    // `new Worker(new URL("./x", import.meta.url))` as a worker entry point by
    // pattern-matching it; through the "@/" alias it matches nothing, the
    // worker never gets bundled, and the URL 404s at runtime.
    const worker = new Worker(
      new URL("../workers/imaging.worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      const pending = this.pending.get(message.id);
      if (!pending) return;

      this.pending.delete(message.id);

      if (message.type === "error") {
        pending.reject(new Error(message.message));
        return;
      }

      pending.resolve({
        coverage: new Uint8ClampedArray(message.coverage),
        bounds: message.bounds,
        selected: message.selected,
      });
    };

    worker.onerror = (event) => {
      const error = new Error(event.message || "Flood fill worker failed");
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    };

    this.worker = worker;
    return worker;
  }

  /** Ships the pixels over once per surface revision, not once per request. */
  private load(worker: Worker, sourceId: string, surface: Surface) {
    if (this.loaded.get(sourceId) === surface.revision) return;

    const image = surface.read();
    const load: WorkerRequest = {
      type: "load",
      sourceId,
      revision: surface.revision,
      pixels: image.data.buffer as ArrayBuffer,
      width: surface.width,
      height: surface.height,
    };

    // read() already handed back a private copy, so transferring it costs
    // nothing here and saves a structured clone on the way over.
    worker.postMessage(load, [load.pixels]);
    this.loaded.set(sourceId, surface.revision);
  }

  async select(
    sourceId: string,
    surface: Surface,
    options: {
      seedX: number;
      seedY: number;
      tolerance: number;
      contiguous: boolean;
    }
  ): Promise<Selection> {
    const worker = this.ensureWorker();
    this.load(worker, sourceId, surface);

    const id = this.nextId++;
    const request: WorkerRequest = {
      type: "fill",
      id,
      sourceId,
      ...options,
    };

    return new Promise<Selection>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage(request);
    });
  }

  /**
   * Re-fits a coverage field to the layer's own edges. Uses the pixels the
   * worker already holds as the guide, so only the coverage crosses the thread
   * boundary.
   */
  async refine(
    sourceId: string,
    surface: Surface,
    coverage: Uint8ClampedArray,
    options: { radius: number; epsilon: number }
  ): Promise<Selection> {
    const worker = this.ensureWorker();
    this.load(worker, sourceId, surface);

    const id = this.nextId++;
    // A copy, because the transfer detaches whatever it is handed and the
    // caller still needs its selection if this fails.
    const payload = new Uint8ClampedArray(coverage).buffer as ArrayBuffer;

    const request: WorkerRequest = {
      type: "refine",
      id,
      sourceId,
      coverage: payload,
      ...options,
    };

    return new Promise<Selection>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage(request, [payload]);
    });
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
    this.loaded.clear();
  }
}
