import { readUpload } from "@/lib/server/store-fs";

/** Serves product photos uploaded from the dashboard. */
export async function GET(_req: Request, { params }: RouteContext<"/media/[file]">) {
  const { file } = await params;
  const data = await readUpload(file);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      // File names are random and never reused, so they can be cached forever
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
