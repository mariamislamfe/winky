import { randomUUID } from "node:crypto";
import { PRODUCT_IMAGE } from "@/config/catalog";
import { isAdmin } from "@/lib/server/auth";
import { takeIncomingPhoto } from "@/lib/server/designs";
import { processProductPhoto } from "@/lib/server/photo";
import { photoUrl, saveProductPhoto } from "@/lib/server/store";

/**
 * Step 2 of a dashboard photo upload (the file is already in storage, see
 * lib/upload.ts): removes a plain white background, crops to the product,
 * converts to WebP (see lib/server/photo.ts) and reports whether the photo
 * is a cut-out.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Your session expired. Log in again." }, { status: 401 });

  const { fileId, name } = await request.json().catch(() => ({}));
  const label = String(name ?? "That photo").slice(0, 80);
  const input = await takeIncomingPhoto(String(fileId ?? ""));
  if (!input) return Response.json({ error: `“${label}” didn't arrive. Upload it again.` }, { status: 400 });

  try {
    const { data, width, height, cutout } = await processProductPhoto(input, PRODUCT_IMAGE.maxPx);
    const file = `${randomUUID()}.webp`;
    await saveProductPhoto(file, data);
    return Response.json({ src: photoUrl(file), width, height, cutout, alt: "" });
  } catch {
    return Response.json({ error: `“${label}” couldn't be read as an image.` }, { status: 422 });
  }
}
