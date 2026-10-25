"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import type { Customization, Product } from "@/lib/types";

/**
 * Add-to-bag with built-in feedback: the label swaps to "Added" and the
 * eye winks. Cases need a phone model first, so without one this becomes
 * a link to the product page instead of a dead button.
 */
export function AddToBagButton({
  product,
  variant,
  custom,
  quantity = 1,
  className = "",
  disabled,
  openDrawer = true,
  label = "Add to bag",
  style,
}: {
  product: Product;
  variant?: string;
  custom?: Customization;
  quantity?: number;
  className?: string;
  disabled?: boolean;
  openDrawer?: boolean;
  label?: string;
  style?: React.CSSProperties;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  if (product.category === "case" && !variant && !custom && !product.customOnly) {
    return (
      <Link href={`/shop/${product.slug}`} className={`btn ${className}`}>
        Choose your model <span className="wink-eye" aria-hidden />
      </Link>
    );
  }
  if (product.customOnly && !custom) {
    return (
      <Link href={`/customize?product=${product.category}`} className={`btn ${className}`}>
        Start customizing <span className="wink-eye" aria-hidden />
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      style={style}
      onClick={() => {
        add({ slug: product.slug, variant, custom, quantity }, { openDrawer });
        setAdded(true);
      }}
      className={`btn overflow-hidden ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={added ? "added" : "idle"}
          initial={{ y: 22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -22, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="inline-flex items-center gap-2"
        >
          {added ? "Added to bag" : label}
          <span
            className="wink-eye"
            aria-hidden
            style={added ? { transform: "scaleY(0.22) scaleX(1.25)" } : undefined}
          />
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {added ? `${product.name} added to bag` : ""}
      </span>
    </button>
  );
}
