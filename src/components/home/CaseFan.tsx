"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { CaseMockup } from "@/components/art/CaseMockup";
import { ProductVisual } from "@/components/art/ProductVisual";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { formatPrice } from "@/lib/format";

const SECTION = "relative overflow-hidden rounded-t-[min(14vw,140px)] pt-16 pb-12 md:pt-20 md:pb-14";

/**
 * Stage, details and the hand of cards all fit in one screen, so picking a
 * case from the hand shows it on the stage without scrolling.
 *
 * Images fill fixed-ratio boxes (size-full + object-contain) instead of
 * relying on their intrinsic size, so a case looks the same size wherever it
 * lands after the shared-layout swap.
 */
export function CaseFan() {
  const cases = useCatalog().byCategory("case");
  const n = cases.length;
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();

  if (n === 0) return <CasesComingSoon />;

  const current = Math.min(active, n - 1);
  const product = cases[current];
  const canFlip = product.images.length > 1;
  const hand = cases.map((c, i) => ({ c, i })).filter((x) => x.i !== current);
  const mid = (hand.length - 1) / 2;
  // Keep the fan's spread the same however many cases there are: the outer
  // cards tilt at most ~20° and sit at most ~28px lower than the middle.
  const tilt = Math.min(5, 20 / Math.max(mid, 1));
  const sag = Math.min(2, 28 / Math.max(mid * mid, 1));

  const select = (i: number) => {
    setActive(((i % n) + n) % n);
    setFlipped(false);
  };

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 26 };
  const arrow =
    "grid size-11 shrink-0 place-items-center rounded-full ring-2 ring-current/30 transition-transform duration-300 ease-[var(--ease-gum)] hover:scale-110 active:scale-90";
  const btnColors = { ["--btn-bg" as string]: product.stageInk, ["--btn-fg" as string]: product.stage };

  return (
    <div className="bg-cobalt">
      <motion.section
        id="cases"
        aria-labelledby="cases-title"
        initial={false}
        animate={{ backgroundColor: product.stage, color: product.stageInk }}
        transition={{ duration: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden rounded-t-[min(14vw,140px)] pt-14 pb-4 md:pt-16 md:pb-6"
        style={{ backgroundColor: product.stage, color: product.stageInk }}
      >
        <LayoutGroup id="case-fan">
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-5 md:grid-cols-2 md:px-10">
            {/* Heading: across the top on mobile, top of the right column on desktop */}
            <div className="col-span-2 md:col-span-1 md:col-start-2 md:row-start-1 md:self-end">
              <h2 id="cases-title" className="font-display text-[clamp(3rem,6.5vw,6.5rem)] leading-[0.85]">
                Cases
              </h2>
              <p className="mt-2 hidden max-w-[36ch] text-lg font-medium opacity-90 md:block">
                Slim, graphic, very personal.{n > 1 ? " Pick one from the hand below and it takes the stage." : ""}
              </p>
            </div>

            {/* Stage */}
            <div className="relative flex h-[min(38svh,92vw)] items-center justify-center md:row-span-3 md:row-start-1 md:h-[min(54svh,560px)]">
              <AnimatePresence initial={false}>
                <motion.span
                  key={product.slug}
                  aria-hidden
                  initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={reduce ? undefined : { scale: 1.15, opacity: 0, transition: { duration: 0.3 } }}
                  transition={{ type: "spring", stiffness: 160, damping: 20 }}
                  className="absolute aspect-square h-[92%] max-w-full rounded-full bg-white/30"
                />
              </AnimatePresence>

              <motion.div
                key={product.slug}
                layoutId={`case-${product.slug}`}
                transition={spring}
                className="relative z-10 aspect-[9/16] h-[94%] [perspective:1400px]"
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 16 }}
                  className="relative size-full [transform-style:preserve-3d]"
                >
                  <div className="absolute inset-0 [backface-visibility:hidden]">
                    <ProductVisual
                      product={product}
                      sizes="(min-width: 768px) 320px, 45vw"
                      className="size-full object-contain drop-shadow-[12px_16px_0_rgb(43_17_64/0.28)]"
                    />
                  </div>
                  {canFlip && (
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <ProductVisual
                        product={product}
                        image={1}
                        sizes="(min-width: 768px) 320px, 45vw"
                        className="size-full object-contain drop-shadow-[12px_16px_0_rgb(43_17_64/0.28)]"
                      />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>

            {/* Active case details + actions */}
            <div className="md:col-start-2 md:row-start-2 md:self-start">
              <div aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={product.slug}
                    initial={reduce ? false : { x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={reduce ? undefined : { x: -20, opacity: 0, transition: { duration: 0.12 } }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  >
                    {n > 1 && (
                      <p className="text-sm font-semibold tabular-nums opacity-80">
                        {String(current + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                      </p>
                    )}
                    <h3 className="font-display mt-1 text-[clamp(1.5rem,4vw,3.2rem)] leading-[0.95]">{product.name}</h3>
                    {product.tagline && <p className="mt-1.5 hidden text-lg opacity-90 md:block">{product.tagline}</p>}
                    <p className="mt-1.5 text-lg font-semibold tabular-nums">{formatPrice(product.price)}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Actions: own full-width row on mobile, under the details on desktop */}
            <div className="col-span-2 md:col-span-1 md:col-start-2 md:row-start-3 md:self-start">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {product.models.length > 0 ? (
                  <Link
                    href={`/shop/${product.slug}`}
                    className="btn min-h-11 px-4 text-sm md:min-h-[52px] md:px-6 md:text-base"
                    style={btnColors}
                  >
                    Choose your model <span className="wink-eye" aria-hidden />
                  </Link>
                ) : (
                  <AddToBagButton product={product} style={btnColors} />
                )}
                {canFlip && (
                  <button
                    type="button"
                    aria-pressed={flipped}
                    onClick={() => setFlipped((f) => !f)}
                    className="btn btn-ghost min-h-11 px-4 text-sm md:min-h-[52px] md:text-base"
                  >
                    {flipped ? "Flip back" : "Flip it"}
                  </button>
                )}
                {n > 1 && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => select(current - 1)} className={arrow} aria-label="Previous case">
                      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                        <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => select(current + 1)} className={arrow} aria-label="Next case">
                      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* The hand of cards, right under the stage */}
          {n > 1 && (
            <div className="relative mx-auto mt-2 w-full max-w-[1400px]">
              <div className="no-scrollbar flex snap-x snap-mandatory items-end gap-1 overflow-x-auto px-5 pt-6 pb-3 md:justify-center md:overflow-visible md:px-10">
                {hand.map(({ c, i }, k) => {
                  const off = k - mid;
                  return (
                    <motion.button
                      key={c.slug}
                      layoutId={`case-${c.slug}`}
                      type="button"
                      onClick={() => select(i)}
                      aria-label={`Show ${c.name}`}
                      initial={false}
                      animate={{ rotate: off * tilt, y: off * off * sag }}
                      whileHover={reduce ? undefined : { y: off * off * sag - 18, rotate: off * tilt * 0.5, scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                      transition={spring}
                      className="relative aspect-[9/16] h-[clamp(96px,15svh,170px)] shrink-0 snap-center md:-mx-1.5"
                      style={{ zIndex: 20 - Math.round(Math.abs(off)) }}
                    >
                      <ProductVisual
                        product={c}
                        decorative
                        sizes="110px"
                        className="size-full object-contain drop-shadow-[5px_7px_0_rgb(43_17_64/0.25)]"
                      />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </LayoutGroup>
      </motion.section>
    </div>
  );
}

function CasesComingSoon() {
  return (
    <div className="bg-cobalt">
      <section aria-labelledby="cases-soon" className={`${SECTION} bg-gum text-grape`}>
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 md:grid-cols-[1fr_1.2fr] md:px-10">
          <CaseMockup color="#FFE3EE" className="order-2 mx-auto h-auto w-[min(46vw,230px)] rotate-6 drop-shadow-[14px_18px_0_rgb(43_17_64/0.25)] md:order-1" />
          <div className="md:order-2">
            <h2 id="cases-soon" className="font-display text-[clamp(4.5rem,13vw,11rem)] leading-[0.82]">
              Cases
            </h2>
            <p className="mt-4 max-w-[36ch] text-lg font-medium">
              New designs are on the way. Until then, put your own design on a plain case.
            </p>
            <Link href="/customize?product=case" className="btn mt-6">
              Design your case <span className="wink-eye" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
