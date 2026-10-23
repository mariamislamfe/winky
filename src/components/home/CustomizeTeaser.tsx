"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CaseMockup } from "@/components/art/CaseMockup";
import { ToteMockup } from "@/components/art/ToteMockup";
import { colorForBase } from "@/lib/catalog";
import { newTextLayer } from "@/lib/layers";
import type { Customization } from "@/lib/types";

/** The plain products, each saying “Your design” where the customer's artwork will go. */
const preview = (baseId: string): Customization => ({
  baseId,
  layers: [{ ...newTextLayer("Your design", { color: "gum" }, "teaser"), size: 0.17 }],
});

const STEPS = ["Upload your design", "Add text if you like", "Place it exactly where you want it"];

export function CustomizeTeaser() {
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="custom-title" className="relative overflow-hidden bg-milk py-20 md:py-28">
      <Link
        href="/customize"
        className="group mx-auto grid max-w-[1400px] items-center gap-12 rounded-[40px] px-5 md:px-10 lg:grid-cols-[1fr_1.1fr]"
      >
        <div>
          <h2 id="custom-title" className="font-display text-[clamp(3.6rem,9vw,8rem)] leading-[0.85] text-gum">
            Make it
            <br />
            yours.
          </h2>
          <p className="mt-5 max-w-[38ch] text-lg">
            Got a design of your own? Put it on a tote or a phone case and see it on the product before you order.
          </p>
          <ol className="mt-6 grid gap-2">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-lg font-medium">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-grape text-sm font-bold text-milk">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <span className="btn mt-8">
            Start designing <span className="wink-eye" aria-hidden />
          </span>
        </div>

        <div aria-hidden className="relative mx-auto flex w-full max-w-[620px] items-end justify-center gap-4 sm:gap-8">
          <motion.div
            className="w-[52%] -rotate-6 transition-transform duration-500 ease-[var(--ease-gum)] group-hover:-rotate-2 group-hover:-translate-y-2"
            initial={reduce ? false : { y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <ToteMockup color={colorForBase("plain-natural", "tote")} custom={preview("plain-natural")} className="h-auto w-full drop-shadow-[12px_14px_0_rgb(43_17_64/0.16)]" />
          </motion.div>
          <motion.div
            className="mb-6 w-[30%] rotate-[8deg] transition-transform duration-500 ease-[var(--ease-gum)] group-hover:rotate-3 group-hover:-translate-y-2"
            initial={reduce ? false : { y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.08 }}
          >
            <CaseMockup color={colorForBase("plain-milk", "case")} custom={preview("plain-milk")} className="h-auto w-full drop-shadow-[10px_12px_0_rgb(43_17_64/0.18)]" />
          </motion.div>
        </div>
      </Link>
    </section>
  );
}
