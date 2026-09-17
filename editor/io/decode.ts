/**
 * Turning a dropped, picked or pasted file into pixels.
 *
 * `imageOrientation: "from-image"` matters more than it looks: without it,
 * phone photos arrive rotated, because their EXIF orientation is metadata the
 * decoder would otherwise ignore.
 */
export async function decodeImage(source: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(source, {
    imageOrientation: "from-image",
  });

  try {
    return drawToImageData(bitmap);
  } finally {
    bitmap.close();
  }
}

function drawToImageData(bitmap: ImageBitmap): ImageData {
  const { width, height } = bitmap;

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) {
      context.drawImage(bitmap, 0, 0);
      return context.getImageData(0, 0, width, height);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("2D canvas is not available in this browser");

  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, width, height);
}

export const SUPPORTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function isSupportedImage(file: File | null): file is File {
  return Boolean(file) && file!.type.startsWith("image/");
}

/** The first image among dropped files, or null. */
export function firstImage(files: FileList | File[] | null): File | null {
  if (!files) return null;
  for (const file of Array.from(files)) {
    if (isSupportedImage(file)) return file;
  }
  return null;
}

/** The first image on the clipboard, or null. */
export function firstImageFromClipboard(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of Array.from(data.items)) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (isSupportedImage(file)) return file;
  }
  return null;
}

/** Strips the extension, so a document reads as "portre" rather than "portre.png". */
export function documentNameFor(file: File): string {
  return file.name.replace(/\.[^.]+$/, "") || file.name;
}
