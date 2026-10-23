import { UPLOAD } from "@/config/customization";

export type PreparedImage = {
  src: string;
  name: string;
  aspect: number;
  originalWidth: number;
  originalHeight: number;
};

export class UploadError extends Error {}

/**
 * Validates a customer's artwork file and makes a lightweight preview copy
 * (longest side ≤ UPLOAD.previewMaxPx) for the live preview and the cart.
 * The original file is not sent anywhere: production upload isn't connected.
 */
export async function prepareUpload(file: File): Promise<PreparedImage> {
  if (!(UPLOAD.accept as readonly string[]).includes(file.type)) {
    throw new UploadError(`That file type isn't supported. Upload a ${UPLOAD.acceptLabel} file.`);
  }
  if (file.size > UPLOAD.maxFileMb * 1024 * 1024) {
    throw new UploadError(`That file is over ${UPLOAD.maxFileMb} MB. Upload a smaller version.`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new UploadError("That image couldn't be opened. Try exporting it again as PNG or JPG.");
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, UPLOAD.previewMaxPx / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new UploadError("Your browser couldn't process that image.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // WebP keeps transparency and stays small; browsers without WebP encoding return PNG.
  const src = canvas.toDataURL("image/webp", 0.9);

  return {
    src,
    name: file.name,
    aspect: height / width,
    originalWidth: width,
    originalHeight: height,
  };
}
