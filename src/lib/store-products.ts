import { SAMPLE_PRODUCTS } from "@/data/samples";
import type { Product } from "./types";

/** Real products a customer can see: published and with at least one photo. */
export const liveProducts = (all: Product[]) => all.filter((p) => p.published && p.images.length > 0);

/**
 * What the storefront shows: your published products, or, until the first
 * one is published, the built-in samples so the store never looks empty.
 */
export function storefrontProducts(all: Product[]): Product[] {
  const live = liveProducts(all);
  return live.length ? live : SAMPLE_PRODUCTS;
}
