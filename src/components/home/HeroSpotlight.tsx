"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ProductVisual } from "@/components/art/ProductVisual";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

const SWAP_MS = 3400;
const MAX = 6;

/** Samples that read well on bubblegum, used while the store shows samples. */
const SAMPLE_PICKS = ["cherry-pop-tote", "wink-wink-case", "lucky-stars-case", "gumball-machine-tote"];

function featured(products: Product[]) {
  if (products[0]?.sample) {
    return SAMPLE_PICKS.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean) as Product[];
  }
  // New products first, cut-outs before photos with a background
  const score = (p: Product) => (p.isNew ? 0 : 2) + (p.images[0]?.cutout ? 0 : 1);
  return [...products].sort((a, b) => score(a) - score(b)).slice(0, MAX);
}

/**
 * One product at a time, standing on the wordmark. Every few seconds the
 * current one sinks behind the letters and the next pops up in its place.
 */
export function HeroSpotlight() {
  const { products } = useCatalog();
  const list = useMemo(() => featured(products), [products]);
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const product = list[index % Math.max(list.length, 1)];

  useEffect(() => {
    if (reduce || paused || list.length < 2) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % list.length);
    }, SWAP_MS);
    return () => clearInterval(t);
  }, [reduce, paused, list.length]);

  if (!product) return null;

  return (
    <div
      // On phones the shelf is centered, lifted --lift above the bottom, and only takes
      // the height left under the hero buttons (~444px down)
      className="hero-shelf absolute bottom-(--lift) left-1/2 z-20 flex aspect-[4/5] h-[clamp(96px,calc(100svh_-_var(--lift)_-_444px),min(40svh,76vw))] -translate-x-1/2 items-end justify-center [--lift:11vw] [@media(min-height:740px)]:[--lift:22vw] md:right-[7vw] md:bottom-[10.4vw] md:left-auto md:aspect-auto md:h-[min(58svh,33vw)] md:w-[30vw] md:translate-x-0"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* the spotlight disc behind the product */}
      <motion.span
        aria-hidden
        className="absolute bottom-[8%] left-1/2 aspect-square w-[92%] -translate-x-1/2 rounded-full"
        style={{ backgroundColor: product.stage }}
        initial={reduce ? false : { scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 12 }}
        key={`disc-${product.slug}`}
      />

      <div className="hero-item relative flex h-full w-full items-end justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={product.slug}
            className="absolute inset-0 flex items-end justify-center"
            initial={reduce ? false : { y: "70%", rotate: -8, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: "80%", rotate: 6, opacity: 0, transition: { duration: 0.35, ease: [0.5, 0, 0.75, 0] } }}
            transition={{ type: "spring", stiffness: 210, damping: 16 }}
          >
            <Link href={`/shop/${product.slug}`} className="block h-full rounded-3xl" aria-label={`See ${product.name}`}>
              <ProductVisual
                product={product}
                decorative
                priority
                sizes="(min-width: 768px) 30vw, 50vw"
                className="h-full w-auto max-w-full drop-shadow-[12px_16px_0_rgb(43_17_64/0.22)]"
              />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* name + price sticker */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`tag-${product.slug}`}
          initial={reduce ? false : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: -6 }}
          exit={reduce ? undefined : { scale: 0, rotate: 10, transition: { duration: 0.15 } }}
          transition={{ type: "spring", stiffness: 420, damping: 18, delay: reduce ? 0 : 0.15 }}
          className="absolute top-[6%] right-[55%] z-10 w-max max-w-[min(9.5rem,40vw)] origin-bottom-right rounded-2xl bg-butter text-grape shadow-[0_3px_0_rgb(43_17_64/0.25)] md:right-auto md:-left-[14%] md:w-auto md:max-w-[70%]"
        >
          <Link href={`/shop/${product.slug}`} className="block min-h-11 rounded-2xl px-3 py-2.5 md:px-4">
            <span className="block text-xs leading-tight font-bold md:text-sm">{product.name}</span>
            <span className="mt-0.5 block text-xs font-semibold tabular-nums opacity-80 md:text-sm">{formatPrice(product.price)}</span>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
