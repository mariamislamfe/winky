"use client";

import Link from "next/link";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductVisual } from "@/components/art/ProductVisual";
import { ToteMockup } from "@/components/art/ToteMockup";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { comingSoon } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

// A light, compact section: totes are a sneak peek while they're coming soon
const SECTION = "relative overflow-hidden bg-[#FFD1E4] pt-14 pb-14 text-grape md:pt-16 md:pb-12";

function SoonBadge() {
  return (
    <span className="inline-block -rotate-6 rounded-full bg-grape px-4 py-1.5 text-base font-bold text-milk shadow-[0_3px_0_rgb(43_17_64/0.2)] md:text-lg">
      Coming soon
    </span>
  );
}

/** Signed distance from the active slide, wrapped into [-n/2, n/2). */
function offsetOf(i: number, active: number, n: number) {
  let o = i - active;
  if (o >= n / 2) o -= n;
  if (o < -n / 2) o += n;
  return o;
}

export function ToteCarousel() {
  const totes = useCatalog().byCategory("tote");
  const n = totes.length;
  const [active, setActive] = useState(0);
  const [step, setStep] = useState({ id: 0, dir: 1 });
  const [scope, animate] = useAnimate();
  const reduce = useReducedMotion();
  const dragged = useRef(false);
  const product = totes[Math.min(active, n - 1)];
  const soon = comingSoon("tote");

  const go = useCallback(
    (delta: number) => {
      if (!delta || n < 2) return;
      setActive((a) => (a + delta + n) % n);
      setStep((s) => ({ id: s.id + 1, dir: Math.sign(delta) }));
    },
    [n],
  );

  // Bags lag behind the rail and swing back into place.
  useEffect(() => {
    if (!step.id || reduce) return;
    animate(".tote-swing", { rotate: [step.dir * 11, 0] }, { type: "spring", stiffness: 70, damping: 5.5, mass: 0.9 });
    animate(".tote-disc", { scaleX: [1, 1.14, 0.95, 1], scaleY: [1, 0.86, 1.05, 1] }, { duration: 0.6, ease: "easeOut" });
  }, [step, animate, reduce]);

  if (!product) return <TotesComingSoon />;

  return (
    <section
      id="totes"
      aria-roledescription="carousel"
      aria-label="Tote bags"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      className={SECTION}
    >
      <div className="mx-auto flex max-w-[1400px] items-end justify-between gap-6 px-5 md:px-10">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h2 className="totes-title font-display text-[clamp(3.4rem,8vw,6.5rem)] leading-[0.82]">Totes</h2>
            {soon && <SoonBadge />}
          </div>
          <p className="mt-4 max-w-[36ch] text-lg font-medium opacity-85">
            {soon
              ? "Our tote bags are almost here. Here's a first look at the designs."
              : n > 1
                ? `${n} designs on the rail. Drag, swipe or tap a bag to bring it front and center.`
                : "Fresh off the rail."}
          </p>
        </div>
        {n > 1 && (
          <div className="hidden items-center gap-3 md:flex">
            <CarouselButtons onPrev={() => go(-1)} onNext={() => go(1)} />
          </div>
        )}
      </div>

      {/* Stage */}
      <div className="relative mx-auto mt-8 max-w-[1400px] md:mt-2">
      <motion.div
        ref={scope}
        drag={n > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.22}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50 || info.velocity.x < -450) go(1);
          else if (info.offset.x > 50 || info.velocity.x > 450) go(-1);
          setTimeout(() => (dragged.current = false), 0);
        }}
        className="relative h-[min(84vw,340px)] cursor-grab touch-pan-y select-none active:cursor-grabbing md:h-[min(30vw,400px)]"
      >
        {/* the rail */}
        <div aria-hidden className="absolute inset-x-0 top-[3%] h-3 bg-[repeating-linear-gradient(90deg,var(--color-butter)_0_28px,var(--color-milk)_28px_56px)] shadow-[0_4px_0_rgb(43_17_64/0.25)]" />

        {/* candy disc behind the active bag */}
        <motion.div
          aria-hidden
          className="tote-disc absolute top-[22%] left-1/2 aspect-square h-[58%] max-w-[90vw] -translate-x-1/2 rounded-full"
          animate={{ backgroundColor: product.stage }}
          transition={{ duration: 0.45 }}
        />

        <ul className="absolute inset-0">
          {totes.map((t, i) => {
            const o = offsetOf(i, active, n);
            const abs = Math.abs(o);
            const visible = abs <= 1;
            const isActive = o === 0;
            return (
              <motion.li
                key={t.slug}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}: ${t.name}`}
                aria-hidden={!visible}
                initial={false}
                animate={{
                  x: `${o * 118}%`,
                  // sides are just a little smaller than the bag in front
                  scale: isActive ? 1 : 0.84,
                  opacity: visible ? 1 : 0,
                  zIndex: 10 - abs,
                }}
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 210, damping: 24, mass: 0.9 }
                }
                className="absolute top-[3%] left-1/2 -ml-[min(18vw,75px)] w-[min(36vw,150px)] origin-top md:-ml-[min(6vw,88px)] md:w-[min(12vw,176px)]"
              >
                {/* hook */}
                <div aria-hidden className="mx-auto -mt-3 h-12 w-6 rounded-b-full border-[5px] border-t-0 border-grape/40" />
                <div className="tote-swing -mt-[9%] origin-top">
                  {isActive ? (
                    <Link
                      href={`/shop/${t.slug}`}
                      draggable={false}
                      onClick={(e) => dragged.current && e.preventDefault()}
                      className="block rounded-3xl"
                      aria-label={`View ${t.name}`}
                    >
                      <ProductVisual product={t} decorative className="h-auto w-full drop-shadow-[14px_18px_0_rgb(43_17_64/0.3)]" priority={i === 0} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      tabIndex={visible ? 0 : -1}
                      onClick={() => !dragged.current && go(o)}
                      className="block w-full rounded-3xl"
                      aria-label={`Bring ${t.name} to the front`}
                    >
                      <ProductVisual product={t} decorative className="h-auto w-full drop-shadow-[10px_12px_0_rgb(43_17_64/0.3)]" />
                    </button>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
      {/* Info for the active bag */}
        <div className="pointer-events-none mt-2 grid gap-6 px-5 md:absolute md:inset-x-10 md:bottom-0 md:mt-0 md:grid-cols-[minmax(0,26rem)_1fr] md:items-end md:px-0">
          <div aria-live="polite" className="pointer-events-auto min-h-[9.5rem] md:min-h-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={product.slug}
                initial={reduce ? false : { y: 24, opacity: 0, rotate: -2 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={reduce ? undefined : { y: -16, opacity: 0, transition: { duration: 0.14 } }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="origin-left"
              >
                <p className="text-sm font-semibold tabular-nums opacity-70">
                  {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                </p>
                <h3 className="font-display mt-1 text-[clamp(1.9rem,4vw,2.8rem)] leading-[0.95]">{product.name}</h3>
                <p className="mt-2 text-lg opacity-85">
                  {product.tagline}{" "}
                  {!soon && <span className="font-semibold">{formatPrice(product.price)}</span>}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="pointer-events-auto flex flex-wrap items-center gap-3 md:justify-end">
            {n > 1 && (
              <div className="flex gap-3 md:hidden">
                <CarouselButtons onPrev={() => go(-1)} onNext={() => go(1)} />
              </div>
            )}
            <Link href={`/shop/${product.slug}`} className="btn btn-ghost">
              View details
            </Link>
            {!soon && <AddToBagButton product={product} />}
          </div>
        </div>
      </div>
    </section>
  );
}

/** When no tote is published yet. */
function TotesComingSoon() {
  const soon = comingSoon("tote");
  return (
    <section aria-labelledby="totes-soon" className={SECTION}>
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 md:grid-cols-[1.2fr_1fr] md:px-10">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h2 id="totes-soon" className="font-display text-[clamp(3.4rem,8vw,6.5rem)] leading-[0.82]">
              Totes
            </h2>
            <SoonBadge />
          </div>
          <p className="mt-4 max-w-[34ch] text-lg font-medium opacity-85">
            {soon
              ? "Our tote bags are almost here."
              : "New designs are on the way. Until then, put your own design on a plain tote."}
          </p>
          {!soon && (
            <Link href="/customize?product=tote" className="btn mt-6">
              Design your tote <span className="wink-eye" aria-hidden />
            </Link>
          )}
        </div>
        <ToteMockup color="#F4E6D4" className="mx-auto h-auto w-[min(56vw,260px)] -rotate-3 drop-shadow-[12px_14px_0_rgb(43_17_64/0.18)]" />
      </div>
    </section>
  );
}

function CarouselButtons({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const cls =
    "grid size-14 place-items-center rounded-full bg-milk text-grape transition-transform duration-300 ease-[var(--ease-gum)] hover:scale-110 active:scale-90";
  return (
    <>
      <button type="button" onClick={onPrev} className={`${cls} hover:-rotate-12`} aria-label="Previous tote">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button type="button" onClick={onNext} className={`${cls} hover:rotate-12`} aria-label="Next tote">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );
}
