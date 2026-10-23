"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, ViewTransition } from "react";
import { ProductVisual } from "@/components/art/ProductVisual";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { CATEGORY_LABEL } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { AddToBagButton } from "./AddToBagButton";

export function ProductDetail({ product }: { product: Product }) {
  const reduce = useReducedMotion();
  const [photo, setPhoto] = useState(0);
  const [model, setModel] = useState<string>(product.models.length === 1 ? product.models[0] : "");
  const [qty, setQty] = useState(1);
  const [showModelHint, setShowModelHint] = useState(false);
  const isCase = product.category === "case";
  const needsModel = isCase && product.models.length > 0;

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-5 pt-[calc(var(--header-h)+2rem)] pb-16 md:px-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pt-[calc(var(--header-h)+3rem)]">
      {/* Gallery */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div
          className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[40px] md:aspect-square"
          style={{ background: product.stage }}
        >
          <span aria-hidden className="absolute aspect-square w-[72%] rounded-full bg-white/25" />
          <ViewTransition name={`art-${product.slug}`} share="art-morph" default="none">
            <div className="absolute inset-[10%] flex items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={photo}
                  initial={reduce ? false : { opacity: 0, scale: 0.92, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 1.04, transition: { duration: 0.12 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  className="flex size-full items-center justify-center"
                >
                  <ProductVisual
                    product={product}
                    image={photo}
                    priority
                    sizes="(min-width: 1024px) 50vw, 90vw"
                    className="h-auto max-h-full w-auto max-w-full drop-shadow-[14px_16px_0_rgb(43_17_64/0.2)]"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </ViewTransition>
        </div>
        {product.images.length > 1 && (
          <div role="group" aria-label="Product photos" className="mt-4 flex flex-wrap gap-2">
            {product.images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                aria-pressed={photo === i}
                aria-label={`Photo ${i + 1} of ${product.images.length}`}
                onClick={() => setPhoto(i)}
                className="flex size-20 items-center justify-center overflow-hidden rounded-2xl p-1.5 ring-2 ring-grape/15 transition-all hover:ring-grape/40 aria-pressed:ring-4 aria-pressed:ring-grape"
                style={{ background: product.stage }}
              >
                <Image src={img.src} alt="" width={img.width} height={img.height} sizes="80px" className="h-auto max-h-full w-auto max-w-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buy box */}
      <div>
        <nav aria-label="Breadcrumb" className="text-sm font-medium">
          <ol className="flex flex-wrap gap-2 opacity-75">
            <li>
              <Link href="/shop" className="underline-offset-4 hover:underline">
                Shop
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/shop?category=${product.category}`} className="underline-offset-4 hover:underline">
                {CATEGORY_LABEL[product.category].many}
              </Link>
            </li>
          </ol>
        </nav>
        <h1 className="font-display mt-4 text-[clamp(2.8rem,6vw,5rem)] leading-[0.9]">{product.name}</h1>
        <p className="mt-4 text-2xl font-semibold tabular-nums">{formatPrice(product.price)}</p>
        {product.tagline && <p className="mt-6 max-w-[48ch] text-xl font-medium">{product.tagline}</p>}
        {product.description && (
          <div className="mt-3 max-w-[56ch] space-y-3 text-lg opacity-85">
            {product.description.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
        )}

        {needsModel && (
          <fieldset className="mt-8">
            <legend className="font-semibold">
              Phone model <span className="font-normal opacity-70">(required)</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.models.map((m) => (
                <label key={m} className="cursor-pointer">
                  <input
                    type="radio"
                    name="model"
                    value={m}
                    checked={model === m}
                    onChange={() => {
                      setModel(m);
                      setShowModelHint(false);
                    }}
                    className="peer sr-only"
                  />
                  <span className="flex h-11 items-center rounded-full px-4 font-medium ring-2 ring-grape/15 transition-all duration-200 peer-checked:bg-grape peer-checked:text-milk peer-checked:ring-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape hover:ring-grape/40">
                    {m}
                  </span>
                </label>
              ))}
            </div>
            {showModelHint && (
              <p role="alert" className="mt-2 font-semibold text-gum-deep">
                Pick your phone model first.
              </p>
            )}
          </fieldset>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <QuantityStepper value={qty} onChange={setQty} label="Quantity" />
          {needsModel && !model ? (
            <button type="button" className="btn flex-1 sm:flex-none" onClick={() => setShowModelHint(true)}>
              Add to bag <span className="wink-eye" aria-hidden />
            </button>
          ) : (
            <AddToBagButton product={product} variant={model || undefined} quantity={qty} className="flex-1 sm:flex-none" />
          )}
        </div>

        <Link
          href={`/customize?product=${product.category}`}
          className="wink-host mt-8 flex items-center justify-between gap-4 rounded-[28px] bg-butter p-5 transition-transform duration-300 ease-[var(--ease-gum)] hover:-rotate-1"
        >
          <span>
            <span className="font-display block text-2xl">Got your own design?</span>
            <span className="mt-1 block opacity-80">
              Upload it, add text and place it exactly where you want on a plain {isCase ? "case" : "tote"}.
            </span>
          </span>
          <span className="wink-eye shrink-0 text-2xl" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
