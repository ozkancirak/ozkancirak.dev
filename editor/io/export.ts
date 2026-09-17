export type ExportFormat = "png" | "webp" | "jpeg";

export type FormatSpec = {
  id: ExportFormat;
  label: string;
  extension: string;
  mime: string;
  /** Whether the format can carry the cutout's transparency. */
  alpha: boolean;
};

export const FORMATS: FormatSpec[] = [
  { id: "png", label: "PNG", extension: "png", mime: "image/png", alpha: true },
  { id: "webp", label: "WebP", extension: "webp", mime: "image/webp", alpha: true },
  { id: "jpeg", label: "JPG", extension: "jpg", mime: "image/jpeg", alpha: false },
];

/** What transparency is flattened onto for formats that cannot keep it. */
const FLATTEN_COLOR = "#ffffff";

function paint(image: ImageData, flatten: boolean) {
  const { width, height } = image;

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });

  const context = canvas.getContext("2d") as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!context) throw new Error("2D canvas is not available in this browser");

  context.putImageData(image as ImageData, 0, 0);

  if (flatten) {
    // destination-over paints *behind* what is already there, which is exactly
    // what flattening means — the alternative composites over the picture.
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = FLATTEN_COLOR;
    context.fillRect(0, 0, width, height);
  }

  return canvas;
}

export async function encode(
  image: ImageData,
  format: ExportFormat,
  quality = 0.92
): Promise<Blob> {
  const spec = FORMATS.find((f) => f.id === format);
  if (!spec) throw new Error(`Bilinmeyen format: ${format}`);

  const canvas = paint(image, !spec.alpha);

  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: spec.mime, quality });
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error(`${spec.label} olarak kodlanamadı.`)),
      spec.mime,
      quality
    );
  });
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * PNG is the only image type browsers reliably accept on the clipboard, so the
 * copy path always encodes PNG regardless of the chosen export format.
 */
export async function copyToClipboard(image: ImageData) {
  if (!navigator.clipboard?.write) {
    throw new Error("Bu tarayıcı panoya görsel kopyalamayı desteklemiyor.");
  }

  const blob = await encode(image, "png");
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}
