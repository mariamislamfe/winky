"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import { ProductVisual } from "@/components/art/ProductVisual";
import { CATEGORY_LABEL } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  priority,
  morph = true,
}: {
  product: Product;
  priority?: boolean;
  /** Share the artwork with the product page so it morphs on navigation */
  morph?: boolean;
}) {
  const { add } = useCart();
  const href = product.customOnly ? `/customize?product=${product.category}` : `/shop/${product.slug}`;
  const quickAdd = product.category === "tote" && !product.customOnly;
  const hasSecond = product.images.length > 1;
  const art = (
    <div className="absolute inset-[12%] flex items-center justify-center transition-transform duration-500 ease-[var(--ease-gum)] group-hover:-translate-y-2 group-hover:-rotate-3">
      <ProductVisual
        product={product}
        decorative
        priority={priority}
        sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 420px) 45vw, 90vw"
        className={`h-auto max-h-full w-auto max-w-full drop-shadow-[8px_10px_0_rgb(43_17_64/0.18)] ${hasSecond ? "transition-opacity duration-300 group-hover:opacity-0" : ""}`}
      />
      {/* second photo on hover (e.g. the back of a case) */}
      {hasSecond && (
        <ProductVisual
          product={product}
          image={1}
          decorative
          sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, 45vw"
          className="absolute h-auto max-h-full w-auto max-w-full opacity-0 drop-shadow-[8px_10px_0_rgb(43_17_64/0.18)] transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
    </div>
  );

  return (
    <article className="group relative">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-[32px] transition-[border-radius] duration-500 ease-[var(--ease-gum)] group-hover:rounded-[48px]"
        style={{ background: product.stage }}
      >
        {/* graphic motif that swells on hover */}
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 scale-90 rounded-full bg-white/25 transition-transform duration-500 ease-[var(--ease-gum)] group-hover:scale-110"
        />
        {morph ? (
          <ViewTransition name={`art-${product.slug}`} share="art-morph" default="none">
            {art}
          </ViewTransition>
        ) : (
          art
        )}
        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
          {product.isNew && (
            <span className="rotate-[-6deg] rounded-full bg-butter px-3 py-1 text-sm font-bold text-grape shadow-[0_2px_0_rgb(43_17_64/0.2)]">
              New
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h3 className="text-lg leading-tight font-semibold">
            <Link href={href} className="after:absolute after:inset-0 after:rounded-[32px] after:content-['']">
              {product.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm opacity-70">
            {product.customOnly ? "Make it in the customizer" : CATEGORY_LABEL[product.category].one}
          </p>
        </div>
        <span className="shrink-0 text-lg font-semibold tabular-nums">{formatPrice(product.price)}</span>
      </div>

      {quickAdd && (
        <button
          type="button"
          onClick={() => add({ slug: product.slug, quantity: 1 })}
          className="absolute right-3 bottom-[4.6rem] z-10 grid size-12 place-items-center rounded-full bg-grape text-milk opacity-100 shadow-[0_3px_0_rgb(43_17_64/0.3)] transition-all duration-300 ease-[var(--ease-gum)] hover:scale-110 hover:rotate-90 active:scale-90 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
          aria-label={`Add ${product.name} to bag`}
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </article>
  );
}
