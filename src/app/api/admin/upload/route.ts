import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PRODUCT_IMAGE } from "@/config/catalog";
import { isAdmin } from "@/lib/server/auth";
import { saveUpload } from "@/lib/server/store-fs";

/**
 * Product photo upload for the dashboard. Auto-rotates by EXIF, resizes to
 * at most PRODUCT_IMAGE.maxPx, converts to WebP (keeping transparency) and
 * reports whether the photo is a cut-out.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Your session expired. Log in again." }, { status: 401 });

  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
  } catch {
    file = null;
  }
  if (!file) return Response.json({ error: "No file received." }, { status: 400 });
  if (!(PRODUCT_IMAGE.accept as readonly string[]).includes(file.type)) {
    return Response.json({ error: `“${file.name}” isn't a PNG, JPG or WebP image.` }, { status: 415 });
  }
  if (file.size > PRODUCT_IMAGE.maxFileMb * 1024 * 1024) {
    return Response.json({ error: `“${file.name}” is over ${PRODUCT_IMAGE.maxFileMb} MB.` }, { status: 413 });
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(input).metadata();
    const cutout = Boolean(meta.hasAlpha) && !(await sharp(input).stats()).isOpaque;
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: PRODUCT_IMAGE.maxPx, height: PRODUCT_IMAGE.maxPx, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86, alphaQuality: 90 })
      .toBuffer({ resolveWithObject: true });
    const name = `${randomUUID()}.webp`;
    await saveUpload(name, data);
    return Response.json({ src: `/media/${name}`, width: info.width, height: info.height, cutout, alt: "" });
  } catch {
    return Response.json({ error: `“${file.name}” couldn't be read as an image.` }, { status: 422 });
  }
}
