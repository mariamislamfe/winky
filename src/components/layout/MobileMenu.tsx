"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { WinkMark } from "@/components/brand/WinkMark";
import { Sheet } from "@/components/ui/Sheet";
import { NAV_LINKS } from "@/config/site";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  return (
    <Sheet open={open} onClose={onClose} label="Menu" side="full" panelClassName="bg-gum text-grape">
      <div className="flex items-center justify-between px-5 pt-5">
        <WinkMark className="w-14 text-grape" />
        <button
          type="button"
          onClick={onClose}
          className="grid size-14 place-items-center rounded-full bg-grape text-milk"
          aria-label="Close menu"
        >
          <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-1 px-6">
        {NAV_LINKS.map((l, i) => (
          <motion.div
            key={l.href}
            initial={reduce ? false : { y: 40, opacity: 0, rotate: i % 2 ? 3 : -3 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.12 + i * 0.05, type: "spring", stiffness: 380, damping: 22 }}
          >
            <Link
              href={l.href}
              onClick={onClose}
              className="font-display block py-2 text-[clamp(3rem,15vw,5rem)] leading-[0.95] text-milk transition-colors hover:text-grape focus-visible:text-grape"
            >
              {l.label}
            </Link>
          </motion.div>
        ))}
      </nav>
      <p className="px-6 pb-[max(2rem,env(safe-area-inset-bottom))] text-lg font-medium">
        Phone cases and tote bags that wink back.
      </p>
    </Sheet>
  );
}
