"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { findProduct } from "@/lib/catalog";
import type { Category, Product } from "@/lib/types";

type Catalog = {
  products: Product[];
  get: (slug: string) => Product | undefined;
  byCategory: (c: Category) => Product[];
  fresh: () => Product[];
};

const CatalogContext = createContext<Catalog | null>(null);

/** Published products from the dashboard, provided once by the site layout. */
export function CatalogProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  const value = useMemo<Catalog>(
    () => ({
      products,
      get: (slug) => findProduct(products, slug),
      byCategory: (c) => products.filter((p) => p.category === c),
      fresh: () => products.filter((p) => p.isNew),
    }),
    [products],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
