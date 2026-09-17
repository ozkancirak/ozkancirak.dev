import type { EditorDocument } from "@/editor/core/document";
import { createQuad, linkProgram, RenderTarget } from "./glutil";
import {
  blendModeIndex,
  COMPOSITE_FRAGMENT,
  QUAD_VERTEX,
  SCREEN_FRAGMENT,
  SELECTION_FRAGMENT,
} from "./shaders";
import { TextureCache } from "./texture-cache";

/** Document pixels to CSS pixels, plus a pan offset in CSS pixels, y down. */
export type View = { zoom: number; panX: number; panY: number };

/** A coverage field at document size, drawn as an animated outline. */
export type SelectionOverlay = {
  coverage: Uint8ClampedArray;
  width: number;
  height: number;
};

const APP_BACKGROUND = [0x09 / 255, 0x09 / 255, 0x09 / 255] as const;
const CHECKER_A = [0x17 / 255, 0x17 / 255, 0x17 / 255] as const;
const CHECKER_B = [0x21 / 255, 0x21 / 255, 0x21 / 255] as const;
const CHECKER_SIZE = 8;
/** Dash length of the marching ants, in device pixels. */
const ANT_DASH = 6;

export class Compositor {
  private readonly gl: WebGL2RenderingContext;
  private readonly quad: WebGLVertexArrayObject;
  private readonly cache: TextureCache;

  private readonly composite: WebGLProgram;
  private readonly screen: WebGLProgram;
  private readonly selection: WebGLProgram;
  private readonly compositeUniforms: Record<string, WebGLUniformLocation | null>;
  private readonly screenUniforms: Record<string, WebGLUniformLocation | null>;
  private readonly selectionUniforms: Record<string, WebGLUniformLocation | null>;

  private targets: [RenderTarget, RenderTarget] | null = null;
  private selectionTexture: WebGLTexture | null = null;
  /** Identity of the coverage buffer currently on the GPU. */
  private selectionKey: Uint8ClampedArray | null = null;
  private warnedMismatch = false;
  private cssWidth = 1;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) throw new Error("WebGL2 is not available in this browser");
    this.gl = gl;

    this.quad = createQuad(gl);
    this.cache = new TextureCache(gl);
    this.composite = linkProgram(gl, QUAD_VERTEX, COMPOSITE_FRAGMENT);
    this.screen = linkProgram(gl, QUAD_VERTEX, SCREEN_FRAGMENT);
    this.selection = linkProgram(gl, QUAD_VERTEX, SELECTION_FRAGMENT);

    const locate = (program: WebGLProgram, names: string[]) =>
      Object.fromEntries(
        names.map((name) => [name, gl.getUniformLocation(program, name)])
      );

    this.compositeUniforms = locate(this.composite, [
      "uDest",
      "uFlipY",
      "uBackdrop",
      "uSource",
      "uMask",
      "uHasMask",
      "uOpacity",
      "uBlendMode",
    ]);
    this.screenUniforms = locate(this.screen, [
      "uDest",
      "uFlipY",
      "uImage",
      "uCheckerSize",
      "uCheckerA",
      "uCheckerB",
    ]);
    this.selectionUniforms = locate(this.selection, [
      "uDest",
      "uFlipY",
      "uCoverage",
      "uStep",
      "uTime",
      "uDash",
    ]);

    // Every blend is done in the fragment shader, so fixed-function blending
    // must stay off or it would apply a second time.
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
  }

  private ensureTargets(width: number, height: number) {
    const current = this.targets?.[0];
    if (current && current.width === width && current.height === height) return;

    this.targets?.forEach((target) => target.dispose());
    this.targets = [
      new RenderTarget(this.gl, width, height),
      new RenderTarget(this.gl, width, height),
    ];
  }

  render(
    document: EditorDocument | null,
    view: View,
    selection: SelectionOverlay | null = null,
    time = 0
  ) {
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(APP_BACKGROUND[0], APP_BACKGROUND[1], APP_BACKGROUND[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!document) return;

    const composited = this.compositeLayers(document);
    if (!composited) return;

    const rect = this.documentRect(document, view);
    this.drawToScreen(rect, composited.texture);
    if (selection) this.drawSelection(rect, selection, time);

    this.cache.collect();
    gl.bindVertexArray(null);
  }

  /**
   * Composites at full document resolution and reads the result back.
   *
   * Export goes through the same passes the screen does, so what lands in the
   * file is what was on screen — no second code path to drift out of step.
   */
  readComposite(document: EditorDocument): ImageData | null {
    const gl = this.gl;

    const composited = this.compositeLayers(document);
    if (!composited) return null;

    const pixels = new Uint8ClampedArray(document.width * document.height * 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, composited.framebuffer);
    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    gl.readPixels(
      0,
      0,
      document.width,
      document.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    // readPixels walks upward from the framebuffer's bottom row, and the
    // compositing passes put the document's top row there — so the rows come
    // out in ImageData order already, with no flip.
    return new ImageData(pixels, document.width, document.height);
  }

  /** Runs the layer stack into the ping-pong targets; returns the one holding the result. */
  private compositeLayers(document: EditorDocument): RenderTarget | null {
    const gl = this.gl;

    this.cache.beginFrame();
    this.ensureTargets(document.width, document.height);
    if (!this.targets) return null;

    let [target, spare] = this.targets;

    gl.bindVertexArray(this.quad);

    // Start from nothing: a fully transparent backdrop.
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, document.width, document.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.composite);
    gl.uniform4f(this.compositeUniforms.uDest, -1, -1, 2, 2);
    gl.uniform1i(this.compositeUniforms.uFlipY, 0);
    gl.uniform1i(this.compositeUniforms.uBackdrop, 0);
    gl.uniform1i(this.compositeUniforms.uSource, 1);
    gl.uniform1i(this.compositeUniforms.uMask, 2);

    for (const layer of document.layers) {
      if (!layer.visible || layer.opacity <= 0) continue;

      if (
        layer.surface.width !== document.width ||
        layer.surface.height !== document.height
      ) {
        // Faz 1 assumes document-sized layers. Stretching one to fit would be
        // a far more confusing bug than skipping it.
        if (!this.warnedMismatch) {
          this.warnedMismatch = true;
          console.warn(
            `Layer ${layer.name} is ${layer.surface.width}x${layer.surface.height}, ` +
              `document is ${document.width}x${document.height} - skipped.`
          );
        }
        continue;
      }

      const hasMask = Boolean(layer.mask) && layer.maskEnabled;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.cache.get(layer.surface));
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(
        gl.TEXTURE_2D,
        hasMask && layer.mask ? this.cache.get(layer.mask) : null
      );

      gl.uniform1i(this.compositeUniforms.uHasMask, hasMask ? 1 : 0);
      gl.uniform1f(this.compositeUniforms.uOpacity, layer.opacity);
      gl.uniform1i(
        this.compositeUniforms.uBlendMode,
        blendModeIndex(layer.blendMode)
      );

      gl.bindFramebuffer(gl.FRAMEBUFFER, spare.framebuffer);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      [target, spare] = [spare, target];
    }

    return target;
  }

  /** The document's on-screen box, in device pixels, y measured from the top. */
  private documentRect(document: EditorDocument, view: View) {
    const canvasWidth = this.gl.canvas.width;
    const canvasHeight = this.gl.canvas.height;
    const dpr = canvasWidth / Math.max(1, this.cssWidth);

    const width = document.width * view.zoom * dpr;
    const height = document.height * view.zoom * dpr;

    return {
      left: canvasWidth / 2 + view.panX * dpr - width / 2,
      top: canvasHeight / 2 + view.panY * dpr - height / 2,
      width,
      height,
      dpr,
      zoom: view.zoom,
      canvasWidth,
      canvasHeight,
    };
  }

  private setDest(
    location: WebGLUniformLocation | null,
    rect: ReturnType<Compositor["documentRect"]>
  ) {
    this.gl.uniform4f(
      location,
      (2 * rect.left) / rect.canvasWidth - 1,
      (2 * (rect.canvasHeight - rect.top - rect.height)) / rect.canvasHeight - 1,
      (2 * rect.width) / rect.canvasWidth,
      (2 * rect.height) / rect.canvasHeight
    );
  }

  private drawToScreen(
    rect: ReturnType<Compositor["documentRect"]>,
    texture: WebGLTexture
  ) {
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, rect.canvasWidth, rect.canvasHeight);
    gl.useProgram(this.screen);

    this.setDest(this.screenUniforms.uDest, rect);
    // The compositing passes leave the document upside down in the target;
    // this is the single flip that puts it back.
    gl.uniform1i(this.screenUniforms.uFlipY, 1);
    gl.uniform1i(this.screenUniforms.uImage, 0);
    gl.uniform1f(this.screenUniforms.uCheckerSize, CHECKER_SIZE * rect.dpr);
    gl.uniform3fv(this.screenUniforms.uCheckerA, CHECKER_A);
    gl.uniform3fv(this.screenUniforms.uCheckerB, CHECKER_B);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private drawSelection(
    rect: ReturnType<Compositor["documentRect"]>,
    selection: SelectionOverlay,
    time: number
  ) {
    const gl = this.gl;
    const texture = this.uploadSelection(selection);
    if (!texture) return;

    gl.useProgram(this.selection);
    this.setDest(this.selectionUniforms.uDest, rect);
    gl.uniform1i(this.selectionUniforms.uFlipY, 1);
    gl.uniform1i(this.selectionUniforms.uCoverage, 0);

    // One screen pixel in texture space, but never finer than one document
    // texel — zoomed in past 1:1 the neighbours would otherwise land on the
    // same texel and the outline would vanish.
    const spread = Math.max(1, 1 / (rect.zoom * rect.dpr));
    gl.uniform2f(
      this.selectionUniforms.uStep,
      spread / selection.width,
      spread / selection.height
    );
    gl.uniform1f(this.selectionUniforms.uTime, time);
    gl.uniform1f(this.selectionUniforms.uDash, ANT_DASH * rect.dpr);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // The outline is the one pass that composites over what is already there.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
  }

  /** Coverage goes up as R8 — a quarter of the memory RGBA would cost. */
  private uploadSelection(selection: SelectionOverlay): WebGLTexture | null {
    const gl = this.gl;

    if (this.selectionKey === selection.coverage && this.selectionTexture) {
      return this.selectionTexture;
    }

    if (!this.selectionTexture) {
      this.selectionTexture = gl.createTexture();
      if (!this.selectionTexture) return null;

      gl.bindTexture(gl.TEXTURE_2D, this.selectionTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    gl.bindTexture(gl.TEXTURE_2D, this.selectionTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R8,
      selection.width,
      selection.height,
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      selection.coverage
    );

    this.selectionKey = selection.coverage;
    return this.selectionTexture;
  }

  /** Sizes the drawing buffer. Pass CSS pixels; the device ratio is applied here. */
  resize(cssWidth: number, cssHeight: number, dpr: number) {
    const canvas = this.gl.canvas as HTMLCanvasElement;
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));

    this.cssWidth = Math.max(1, cssWidth);
    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
  }

  dispose() {
    this.targets?.forEach((target) => target.dispose());
    this.targets = null;

    if (this.selectionTexture) this.gl.deleteTexture(this.selectionTexture);
    this.selectionTexture = null;
    this.selectionKey = null;

    this.cache.dispose();
    this.gl.deleteProgram(this.composite);
    this.gl.deleteProgram(this.screen);
    this.gl.deleteProgram(this.selection);
    this.gl.deleteVertexArray(this.quad);
  }
}
