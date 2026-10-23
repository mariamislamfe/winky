import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PRODUCT_IMAGE } from "@/config/catalog";
import { isAdmin } from "@/lib/server/auth";
import { takeIncomingPhoto } from "@/lib/server/designs";
import { photoUrl, saveProductPhoto } from "@/lib/server/store";

/**
 * Step 2 of a dashboard photo upload (the file is already in storage, see
 * lib/upload.ts). Auto-rotates by EXIF, resizes to at most
 * PRODUCT_IMAGE.maxPx, converts to WebP (keeping transparency) and reports
 * whether the photo is a cut-out.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Your session expired. Log in again." }, { status: 401 });

  const { fileId, name } = await request.json().catch(() => ({}));
  const label = String(name ?? "That photo").slice(0, 80);
  const input = await takeIncomingPhoto(String(fileId ?? ""));
  if (!input) return Response.json({ error: `“${label}” didn't arrive. Upload it again.` }, { status: 400 });

  try {
    const meta = await sharp(input).metadata();
    const cutout = Boolean(meta.hasAlpha) && !(await sharp(input).stats()).isOpaque;
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: PRODUCT_IMAGE.maxPx, height: PRODUCT_IMAGE.maxPx, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86, alphaQuality: 90 })
      .toBuffer({ resolveWithObject: true });
    const file = `${randomUUID()}.webp`;
    await saveProductPhoto(file, data);
    return Response.json({ src: photoUrl(file), width: info.width, height: info.height, cutout, alt: "" });
  } catch {
    return Response.json({ error: `“${label}” couldn't be read as an image.` }, { status: 422 });
  }
}
