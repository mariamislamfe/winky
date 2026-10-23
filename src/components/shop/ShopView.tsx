"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { WinkMark } from "@/components/brand/WinkMark";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { CUSTOM_BASES } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "tote", label: "Tote bags" },
  { id: "case", label: "Phone cases" },
  { id: "custom", label: "Make your own" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "new", label: "Newest first" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

const isFilter = (v: string | null): v is FilterId => FILTERS.some((f) => f.id === v);
const isSort = (v: string | null): v is SortId => SORTS.some((s) => s.id === v);

const BLANKS = Object.values(CUSTOM_BASES);

export function filterProducts(products: Product[], filter: FilterId, sort: SortId) {
  let list =
    filter === "custom" ? [] : products.filter((p) => filter === "all" || p.category === filter);
  if (sort === "new") list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === "price-asc" || sort === "price-desc") {
    const dir = sort === "price-asc" ? 1 : -1;
    list = [...list].sort((a, b) => (a.price - b.price) * dir);
  }
  // Blank bases always go last; they're an invitation, not a design.
  const blanks = filter === "all" || filter === "custom" ? BLANKS : BLANKS.filter((b) => b.category === filter);
  return [...list, ...blanks];
}

export function ShopGrid({ filter, sort }: { filter: FilterId; sort: SortId }) {
  const reduce = useReducedMotion();
  const { products } = useCatalog();
  const items = useMemo(() => filterProducts(products, filter, sort), [products, filter, sort]);
  const designs = items.filter((p) => !p.customOnly).length;
  return (
    <LayoutGroup>
      <motion.ul layout className="grid grid-cols-1 gap-x-5 gap-y-10 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((p, i) => (
            <motion.li
              key={p.slug}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.85, rotate: i % 2 ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.8, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <ProductCard product={p} priority={i < 4} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {designs === 0 && filter !== "custom" && (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-[32px] bg-white/60 px-6 py-14 text-center">
          <WinkMark className="w-20 text-gum" />
          <p className="font-display text-3xl">New designs are on the way.</p>
          <p className="max-w-[40ch] opacity-75">Nothing here yet. In the meantime, you can make your own.</p>
          <Link href="/customize" className="btn mt-2">
            Customize yours <span className="wink-eye" aria-hidden />
          </Link>
        </div>
      )}
    </LayoutGroup>
  );
}

export function ShopView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const rawCategory = params.get("category");
  const rawSort = params.get("sort");
  const filter: FilterId = isFilter(rawCategory) ? rawCategory : "all";
  const sort: SortId = isSort(rawSort) ? rawSort : "featured";
  const { products } = useCatalog();
  const count = filterProducts(products, filter, sort).length;

  const update = (next: { category?: FilterId; sort?: SortId }) => {
    const q = new URLSearchParams(params.toString());
    const c = next.category ?? filter;
    const s = next.sort ?? sort;
    if (c === "all") q.delete("category");
    else q.set("category", c);
    if (s === "featured") q.delete("sort");
    else q.set("sort", s);
    const qs = q.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    // Category is a place you can go Back from; sort order is just a view tweak.
    if (next.category) router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  };

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filter products" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1 md:mx-0 md:px-0">
          {FILTERS.map((f) => {
            const on = f.id === filter;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => update({ category: f.id })}
                className={`relative h-12 shrink-0 rounded-full px-5 font-semibold transition-colors ${
                  on ? "text-milk" : "text-grape ring-2 ring-grape/15 hover:ring-grape/40"
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 rounded-full bg-grape"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 32 }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium opacity-70 tabular-nums" aria-live="polite">
            {count} {count === 1 ? "product" : "products"}
          </p>
          <label htmlFor="sort" className="sr-only">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => update({ sort: e.target.value as SortId })}
            className="h-12 rounded-full bg-white px-4 pr-10 font-semibold ring-2 ring-grape/15 focus:ring-grape"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-10">
        <ShopGrid filter={filter} sort={sort} />
      </div>
    </>
  );
}
