"use client";

import { SITE } from "@/config/site";

export function QuantityStepper({
  value,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-11" : "h-[52px]";
  const btn = `grid ${size === "sm" ? "w-10" : "w-12"} place-items-center rounded-full text-xl font-semibold transition-transform active:scale-90 disabled:opacity-30 hover:bg-grape/10`;
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex ${h} items-center rounded-full bg-white/70 ${size === "sm" ? "p-0.5" : "p-1"} ring-2 ring-grape/15`}
    >
      <button
        type="button"
        className={`${btn} h-full`}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <output aria-live="polite" className="min-w-8 text-center font-semibold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={`${btn} h-full`}
        onClick={() => onChange(value + 1)}
        disabled={value >= SITE.maxQuantityPerLine}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
