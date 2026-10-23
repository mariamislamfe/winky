import type { Metadata } from "next";
import { Suspense } from "react";
import { WinkMark } from "@/components/brand/WinkMark";
import { PageBlink } from "@/components/layout/PageBlink";
import { ShopGrid, ShopView } from "@/components/shop/ShopView";
import { getStoreProducts } from "@/lib/server/catalog-data";

export const metadata: Metadata = {
  title: "Shop",
  description: "Phone cases and tote bags with original WINKY designs, plus blank ones to design yourself.",
};

function countLine(cases: number, totes: number) {
  if (!cases && !totes) return "New designs are on the way. Until then, make your own.";
  const parts = [
    cases ? `${cases} phone ${cases === 1 ? "case" : "cases"}` : null,
    totes ? `${totes} ${totes === 1 ? "tote" : "totes"}` : null,
  ].filter(Boolean);
  return `${parts.join(", ")}, and two blank ones waiting for your design.`;
}

export default async function ShopPage() {
  const products = await getStoreProducts();
  const totes = products.filter((p) => p.category === "tote").length;
  const cases = products.filter((p) => p.category === "case").length;
  return (
    <>
      <PageBlink />
      <header className="relative overflow-hidden rounded-b-[min(10vw,100px)] bg-gum px-5 pt-[calc(var(--header-h)+4rem)] pb-14 md:px-10 md:pb-20">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h1 className="font-display text-[clamp(4.5rem,15vw,12rem)] leading-[0.8] text-milk">The shop</h1>
          <p className="max-w-[34ch] text-lg font-medium text-grape md:pb-3 md:text-xl">
            {countLine(cases, totes)}
          </p>
        </div>
        <WinkMark className="absolute top-[calc(var(--header-h)+1.5rem)] right-5 w-20 rotate-12 text-cobalt md:right-10 md:w-28" />
      </header>
      <section aria-label="Products" className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-14">
        <Suspense
          fallback={
            <div className="mt-[4.25rem]">
              <ShopGrid filter="all" sort="featured" />
            </div>
          }
        >
          <ShopView />
        </Suspense>
      </section>
    </>
  );
}
