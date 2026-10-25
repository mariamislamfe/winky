// One-time Supabase setup: npm run supabase:setup
//
// 1. Creates the storage buckets (products: public; designs, receipts, settings: private).
// 2. Checks the tables from supabase/schema.sql exist.
// 3. If the products table is empty and a local data/ folder exists (from the
//    file-based version of the store), copies those products and photos in.
//
// Safe to run again: it never overwrites products that are already there.
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const TYPES = ["image/png", "image/jpeg", "image/webp"];
const MB = 1024 * 1024;
const BUCKETS = [
  { id: "products", public: true, fileSizeLimit: 15 * MB },
  { id: "designs", public: false, fileSizeLimit: 15 * MB },
  { id: "receipts", public: false, fileSizeLimit: 10 * MB },
  // store settings saved from the dashboard (custom showcase colours)
  { id: "settings", public: false, fileSizeLimit: 64 * 1024, types: ["application/json"] },
];

for (const b of BUCKETS) {
  const options = { public: b.public, fileSizeLimit: b.fileSizeLimit, allowedMimeTypes: b.types ?? TYPES };
  const { error: missing } = await db.storage.getBucket(b.id);
  const { error } = missing ? await db.storage.createBucket(b.id, options) : await db.storage.updateBucket(b.id, options);
  if (error) throw new Error(`Bucket ${b.id}: ${error.message}`);
  console.log(`✓ bucket ${b.id} (${b.public ? "public" : "private"})`);
}

for (const table of ["products", "orders"]) {
  // (a HEAD request can't tell a missing table apart, so fetch one row)
  const { error } = await db.from(table).select("id").limit(1);
  if (error) {
    console.error(`\n✗ The "${table}" table is missing (${error.message}).`);
    console.error("  Open Supabase → SQL Editor, paste supabase/schema.sql, press Run, then run this again.");
    process.exit(1);
  }
  console.log(`✓ table ${table}`);
}

const { count } = await db.from("products").select("id", { head: true, count: "exact" });
const dataDir = process.env.WINKY_DATA_DIR ?? path.join(process.cwd(), "data");
const file = path.join(dataDir, "products.json");
if (count) {
  console.log(`✓ ${count} products already in Supabase, nothing to import`);
} else if (!existsSync(file)) {
  console.log("✓ no local products to import");
} else {
  const products = JSON.parse(readFileSync(file, "utf8"));
  const publicBase = `${url}/storage/v1/object/public/products/`;
  for (const p of products) {
    for (const img of p.images) {
      const name = img.src.split("/").pop();
      if (!img.src.startsWith("/media/")) continue;
      const { error } = await db.storage
        .from("products")
        .upload(name, readFileSync(path.join(dataDir, "uploads", name)), {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });
      if (error) throw new Error(`Photo ${name}: ${error.message}`);
      img.src = publicBase + name;
    }
  }
  const rows = products.map((p, position) => ({ id: p.id, position, data: p }));
  const { error } = await db.from("products").insert(rows);
  if (error) throw new Error(`Products: ${error.message}`);
  console.log(`✓ imported ${rows.length} products and their photos`);
}
console.log("\nSupabase is ready.");
