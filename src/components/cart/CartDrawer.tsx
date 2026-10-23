"use client";

import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { WinkMark } from "@/components/brand/WinkMark";
import { Sheet } from "@/components/ui/Sheet";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { CartLineItem } from "./CartLineItem";

export function CartDrawer() {
  const { isOpen, close, lines, count, subtotal } = useCart();

  return (
    <Sheet open={isOpen} onClose={close} label="Your bag" panelClassName="bg-milk text-grape shadow-[-12px_0_0_0_var(--color-gum)]">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h2 className="font-display text-4xl">
          Your bag{" "}
          <span className="align-middle font-sans text-base font-semibold tabular-nums opacity-70">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </h2>
        <button
          type="button"
          onClick={close}
          className="grid size-12 place-items-center rounded-full bg-grape text-milk transition-transform hover:rotate-90"
          aria-label="Close bag"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <WinkMark className="w-24 text-gum" />
          <p className="font-display text-3xl">Nothing in here yet.</p>
          <p className="max-w-[28ch] opacity-75">Your bag is empty. The shop is full of things that wink back.</p>
          <Link href="/shop" onClick={close} className="btn mt-2">
            Shop the collection <span className="wink-eye" aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y-2 divide-grape/10 overflow-y-auto overscroll-contain px-6">
            <AnimatePresence initial={false}>
              {lines.map((line) => (
                <CartLineItem key={line.id} line={line} onNavigate={close} />
              ))}
            </AnimatePresence>
          </ul>
          <div className="border-t-2 border-grape/10 bg-white/60 px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Subtotal</span>
              <span className="text-2xl font-bold tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-sm opacity-70">Shipping and taxes are calculated at checkout.</p>
            <div className="mt-4 grid gap-2">
              <Link href="/checkout" onClick={close} className="btn w-full">
                Go to checkout <span className="wink-eye" aria-hidden />
              </Link>
              <button type="button" onClick={close} className="btn btn-ghost w-full">
                Keep shopping
              </button>
            </div>
          </div>
        </>
      )}
    </Sheet>
  );
}
