import "server-only";
import { CASE_PRICE } from "@/config/pricing";
import type { Product } from "@/lib/types";
import { BUCKETS, db, storage, SUPABASE_URL } from "./supabase";

/**
 * Product storage: the `products` table (one row per product, in shop
 * order) and the public `products` photo bucket in Supabase.
 */
export async function readProducts(): Promise<Product[]> {
  const { data, error } = await db().from("products").select("data").order("position");
  if (error) throw new Error(`Couldn't load products: ${error.message}`);
  // Every case costs the same (config/pricing.ts), whatever was saved on it before
  return data.map((row) => {
    const p = row.data as Product;
    return p.category === "case" ? { ...p, price: CASE_PRICE } : p;
  });
}

// Serialize dashboard writes in this server so two saves can't interleave.
let queue: Promise<unknown> = Promise.resolve();

/** Read the list, change it, and write back only the rows that changed. */
export function mutateProducts<T>(fn: (list: Product[]) => Promise<{ list: Product[]; result: T }> | { list: Product[]; result: T }) {
  const run = queue.then(async () => {
    const before = await readProducts();
    const { list, result } = await fn(before);
    const now = new Date().toISOString();
    const changed = list
      .map((p, position) => ({ id: p.id, position, data: p, updated_at: now }))
      .filter((row, i) => before[i]?.id !== row.id || JSON.stringify(before[i]) !== JSON.stringify(row.data));
    if (changed.length) {
      const { error } = await db().from("products").upsert(changed);
      if (error) throw new Error(`Couldn't save products: ${error.message}`);
    }
    const gone = before.filter((p) => !list.some((q) => q.id === p.id)).map((p) => p.id);
    if (gone.length) {
      const { error } = await db().from("products").delete().in("id", gone);
      if (error) throw new Error(`Couldn't delete products: ${error.message}`);
    }
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

// ── Product photos ───────────────────────────────────────────────

/** Only our own generated names are ever written or deleted. */
const PHOTO_NAME = /^[a-f0-9-]{36}\.webp$/;
const PHOTO_BASE = `${SUPABASE_URL}/storage/v1/object/public/${BUCKETS.products}/`;

export const photoUrl = (name: string) => PHOTO_BASE + name;

/** The file name of one of our product photos, or null for any other URL. */
export function photoName(src: string) {
  if (!src.startsWith(PHOTO_BASE)) return null;
  const name = src.slice(PHOTO_BASE.length);
  return PHOTO_NAME.test(name) ? name : null;
}

export async function saveProductPhoto(name: string, data: Buffer) {
  const { error } = await storage("products").upload(name, data, {
    contentType: "image/webp",
    // Names are random and never reused, so browsers can keep them forever
    cacheControl: "31536000",
  });
  if (error) throw new Error(`Couldn't save the photo: ${error.message}`);
}

export async function deleteProductPhotos(srcs: string[]) {
  const names = srcs.map(photoName).filter((n): n is string => Boolean(n));
  if (names.length) await storage("products").remove(names);
}
