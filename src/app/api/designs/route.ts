import { DESIGN_UPLOAD } from "@/config/orders";
import { UPLOAD } from "@/config/customization";
import { allowUpload, saveDesign } from "@/lib/server/designs";

/**
 * Customers upload their original artwork here from the customizer, so the
 * full-quality file is available for printing when they order.
 */
export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (!allowUpload(ip)) {
    return Response.json({ error: "Too many uploads. Wait a few minutes and try again." }, { status: 429 });
  }

  let file: File | null = null;
  try {
    const f = (await request.formData()).get("file");
    file = f instanceof File ? f : null;
  } catch {
    file = null;
  }
  if (!file) return Response.json({ error: "No file received." }, { status: 400 });
  if (!(UPLOAD.accept as readonly string[]).includes(file.type)) {
    return Response.json({ error: `That file type isn't supported. Upload a ${UPLOAD.acceptLabel} file.` }, { status: 415 });
  }
  if (file.size > DESIGN_UPLOAD.maxFileMb * 1024 * 1024) {
    return Response.json({ error: `That file is over ${DESIGN_UPLOAD.maxFileMb} MB.` }, { status: 413 });
  }

  try {
    const saved = await saveDesign(Buffer.from(await file.arrayBuffer()));
    return Response.json(saved);
  } catch {
    return Response.json({ error: "That image couldn't be read. Try exporting it again as PNG or JPG." }, { status: 422 });
  }
}
