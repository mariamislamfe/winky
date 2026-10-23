"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { NAV_LINKS } from "@/config/site";
import { useCart } from "@/lib/cart";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const pathname = usePathname();
  const { count, open, hydrated, lastAdded } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Tuck the header away while scrolling down, bring it back on any scroll up.
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const next = y > 160 && y > last + 4 ? true : y < last - 4 || y < 160 ? false : null;
        if (next !== null) setHidden((h) => (h === next ? h : next));
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return href.includes("?") ? false : path === "/" ? pathname === "/" : pathname.startsWith(path);
  };

  return (
    <>
      <header
        style={{ viewTransitionName: "site-header" }}
        className={`pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 transition-transform duration-500 ease-[var(--ease-snap)] md:px-5 md:pt-4 ${
          hidden && !menuOpen ? "-translate-y-[130%]" : "translate-y-0"
        }`}
        onFocusCapture={() => setHidden(false)}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="pointer-events-auto flex h-14 items-center rounded-full bg-milk px-5 text-grape shadow-[0_3px_0_0_rgb(43_17_64/0.15)]"
            aria-label="WINKY home"
          >
            <Wordmark className="text-[2rem] translate-y-[2px]" />
          </Link>

          <nav aria-label="Main" className="pointer-events-auto hidden h-14 items-center gap-1 rounded-full bg-milk px-2 shadow-[0_3px_0_0_rgb(43_17_64/0.15)] lg:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className="relative flex h-10 items-center rounded-full px-4 font-semibold text-grape transition-colors hover:bg-gum/15 aria-[current=page]:bg-grape aria-[current=page]:text-milk"
                style={{ fontVariationSettings: '"wdth" 90' }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="pointer-events-auto flex items-center gap-2">
            <motion.button
              key={lastAdded?.at ?? "idle"}
              type="button"
              onClick={open}
              initial={lastAdded ? { scale: 1.25, rotate: -10 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
              className="relative flex h-14 items-center gap-2 rounded-full bg-grape pr-5 pl-4 font-semibold text-milk shadow-[0_3px_0_0_rgb(43_17_64/0.25)]"
              aria-label={`Open bag, ${hydrated ? count : 0} ${count === 1 ? "item" : "items"}`}
            >
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
                <path
                  d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z M9 8V6.5a3 3 0 0 1 6 0V8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden sm:inline">Bag</span>
              <span
                className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-sm tabular-nums transition-colors ${
                  hydrated && count > 0 ? "bg-gum text-grape" : "bg-milk/15 text-milk"
                }`}
              >
                {hydrated ? count : 0}
              </span>
            </motion.button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid size-14 place-items-center rounded-full bg-milk text-grape shadow-[0_3px_0_0_rgb(43_17_64/0.15)] lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
                <path d="M4 8h16M4 16h11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
