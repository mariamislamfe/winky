import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Product } from "@/lib/types";

/**
 * File-based product storage.
 *
 * Products live in `<data dir>/products.json` and photos in
 * `<data dir>/uploads/`. This needs a server with a persistent disk
 * (your computer, a VPS, Docker with a volume). On serverless hosts such as
 * Vercel the disk is temporary: swap these functions for a database and
 * object storage (the rest of the app only talks to this module).
 *
 * Set WINKY_DATA_DIR to keep the data outside the project folder.
 */
export const DATA_DIR = process.env.WINKY_DATA_DIR ?? path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");

export async function readProducts(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(PRODUCTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

/**
 * Atomic replace. Windows refuses to rename over a file another request is
 * reading at that instant (EPERM/EBUSY), so retry briefly before giving up.
 */
export async function replaceFile(from: string, to: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if ((code !== "EPERM" && code !== "EBUSY" && code !== "EACCES") || attempt >= 12) {
        await fs.rm(from, { force: true });
        throw err;
      }
      await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
    }
  }
}

// Serialize writes so two saves can't interleave.
let queue: Promise<unknown> = Promise.resolve();

export function mutateProducts<T>(fn: (list: Product[]) => Promise<{ list: Product[]; result: T }> | { list: Product[]; result: T }) {
  const run = queue.then(async () => {
    const current = await readProducts();
    const { list, result } = await fn(current);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${PRODUCTS_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
    await replaceFile(tmp, PRODUCTS_FILE);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Only our own generated names are ever read or deleted. */
export const SAFE_MEDIA_NAME = /^[a-f0-9-]{36}\.webp$/;

export async function saveUpload(name: string, data: Buffer) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, name), data);
}

export async function readUpload(name: string) {
  if (!SAFE_MEDIA_NAME.test(name)) return null;
  try {
    return await fs.readFile(path.join(UPLOADS_DIR, name));
  } catch {
    return null;
  }
}

export async function deleteUploads(srcs: string[]) {
  await Promise.all(
    srcs.map(async (src) => {
      const name = src.split("/").pop() ?? "";
      if (!SAFE_MEDIA_NAME.test(name)) return;
      await fs.rm(path.join(UPLOADS_DIR, name), { force: true });
    }),
  );
}
