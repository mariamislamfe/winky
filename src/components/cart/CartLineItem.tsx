"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ProductVisual } from "@/components/art/ProductVisual";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { linePrice } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { describeCustom } from "@/lib/describe";
import { formatPrice } from "@/lib/format";
import { modelLabel } from "@/lib/models";
import type { CartLine } from "@/lib/types";

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const { setQuantity, remove } = useCart();
  const { products, get } = useCatalog();
  const product = get(line.slug);
  if (!product) return null;
  const unit = linePrice(line, products);
  const href = line.custom ? `/customize?product=${product.category}` : `/shop/${product.slug}`;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, rotate: 4, transition: { duration: 0.22 } }}
      className="flex gap-4 py-4"
    >
      <div
        className="flex h-24 w-20 shrink-0 items-center justify-center rounded-2xl p-2 sm:h-28 sm:w-24"
        style={{ background: product.stage }}
      >
        <ProductVisual product={product} custom={line.custom} decorative sizes="96px" className="size-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <Link href={href} onClick={onNavigate} className="-my-2.5 inline-block py-2.5 font-semibold leading-tight hover:underline">
            {line.custom ? `Custom ${product.category === "tote" ? "tote" : "case"}` : product.name}
          </Link>
          <span className="shrink-0 font-semibold tabular-nums">
            {unit == null ? "Price TBA" : formatPrice(unit * line.quantity)}
          </span>
        </div>
        {line.variant && <p className="text-sm opacity-75">For {modelLabel(line.variant)}</p>}
        {line.custom && (
          <dl className="text-sm leading-snug opacity-75">
            {describeCustom(line.custom, product.category).map((r) => (
              <div key={r.k} className="flex gap-1.5">
                <dt className="font-medium">{r.k}:</dt>
                <dd className="min-w-0 break-words">{r.v}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            onChange={(n) => setQuantity(line.id, n)}
            label={`Quantity for ${product.name}`}
          />
          <button
            type="button"
            onClick={() => remove(line.id)}
            className="min-h-10 rounded-full px-3 text-sm font-medium underline-offset-4 hover:underline"
          >
            Remove<span className="sr-only"> {product.name}</span>
          </button>
        </div>
      </div>
    </motion.li>
  );
}
