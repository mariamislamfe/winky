import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { storefrontProducts } from "@/lib/store-products";
import type { Product } from "@/lib/types";
import { readProducts } from "./store-fs";

export const PRODUCTS_TAG = "products";

/**
 * Products for the storefront: published ones, or the built-in samples until
 * the first real product is published. Cached and tagged so the dashboard
 * can refresh it instantly with updateTag(PRODUCTS_TAG) after every change;
 * the short lifetime is a safety net if the file is edited by hand.
 */
export async function getStoreProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("minutes");
  return storefrontProducts(await readProducts());
}
