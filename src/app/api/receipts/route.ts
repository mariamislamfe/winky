import { allowUpload, saveReceipt } from "@/lib/server/designs";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX_MB = 10;

/** Customers upload a screenshot of their InstaPay deposit transfer at checkout. */
export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (!allowUpload(`receipt:${ip}`)) {
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
  if (!ACCEPT.includes(file.type)) {
    return Response.json({ error: "Upload the screenshot as a PNG or JPG image." }, { status: 415 });
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return Response.json({ error: `That image is over ${MAX_MB} MB.` }, { status: 413 });
  }
  try {
    return Response.json(await saveReceipt(Buffer.from(await file.arrayBuffer())));
  } catch {
    return Response.json({ error: "That image couldn't be read. Take a new screenshot and try again." }, { status: 422 });
  }
}
