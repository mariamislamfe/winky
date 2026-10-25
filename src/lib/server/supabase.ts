import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase holds everything the store saves: products and orders in
 * Postgres, photos and customer files in Storage. Only the server talks to
 * it, with the service role key; the browser never gets database access.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const BUCKETS = {
  /** Product photos, public (shown in the shop) */
  products: "products",
  /** Customers' original artwork, private */
  designs: "designs",
  /** InstaPay transfer screenshots, private */
  receipts: "receipts",
  /** Store settings as JSON (custom showcase colours), private */
  settings: "settings",
} as const;

let client: SupabaseClient | undefined;

export function db() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Supabase isn't set up: add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the environment.");
  }
  client ??= createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Never let Next's fetch cache keep database answers: it isn't cleared by updateTag
    // and outlives deploys, so dashboard edits could stay invisible for up to 15 minutes.
    // Caching is done one level up, in getStoreProducts ("use cache" + the products tag).
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return client;
}

export const storage = (bucket: keyof typeof BUCKETS) => db().storage.from(BUCKETS[bucket]);
