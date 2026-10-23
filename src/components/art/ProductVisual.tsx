"use client";

import Image from "next/image";
import { colorForBase } from "@/lib/catalog";
import type { Customization, Product } from "@/lib/types";
import { CaseMockup } from "./CaseMockup";
import { ToteMockup } from "./ToteMockup";

/**
 * The single entry point for showing a product.
 *
 * Catalog products show their dashboard photos; built-in samples are drawn.
 * Cut-outs (transparent PNG/WebP) float freely; photos with a background just
 * get rounded corners. Custom items are drawn as mockups with the customer's
 * design on top.
 */
export function ProductVisual({
  product,
  image = 0,
  custom,
  className = "",
  sizes = "(min-width: 1024px) 40vw, 80vw",
  priority,
  decorative,
}: {
  product: Product;
  /** Which photo to show (0 = main) */
  image?: number;
  custom?: Customization;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Hide from assistive tech when a nearby label already names the product */
  decorative?: boolean;
}) {
  if (custom || product.customOnly) {
    const color = colorForBase(custom?.baseId ?? "", product.category);
    const title = decorative ? undefined : product.name;
    return product.category === "tote" ? (
      <ToteMockup color={color} custom={custom} title={title} className={className} />
    ) : (
      <CaseMockup color={color} custom={custom} title={title} className={className} />
    );
  }

  const photo = product.images[image] ?? product.images[0];
  // Built-in sample products are drawn, not photographed
  if (!photo && product.art) {
    const title = decorative ? undefined : product.name;
    return product.category === "tote" ? (
      <ToteMockup art={product.art} title={title} className={className} />
    ) : (
      <CaseMockup art={product.art} title={title} className={className} />
    );
  }
  if (!photo) {
    return (
      <div
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : `${product.name} (no photo yet)`}
        className={`grid aspect-[4/5] place-items-center rounded-[1.25rem] bg-white/50 ${className}`}
      />
    );
  }

  return (
    <Image
      src={photo.src}
      alt={decorative ? "" : photo.alt || product.name}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      priority={priority}
      draggable={false}
      className={`object-contain ${photo.cutout ? "" : "rounded-[1.25rem]"} ${className}`}
    />
  );
}
