"use client";

import Link from "next/link";
import { useRef } from "react";
import { ProductVisual } from "@/components/art/ProductVisual";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { Price } from "@/components/shop/Price";
import { CATEGORY_LABEL, comingSoon, wasPrice } from "@/lib/catalog";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";

const TILT = [-5, 4, -2, 6, -4, 3];

/** New designs, slapped onto a sticker sheet. */
export function FreshDrops() {
  const root = useRef<HTMLElement>(null);
  const drops = useCatalog()
    .fresh()
    .filter((p) => !comingSoon(p.category))
    .slice(0, 8);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const items = gsap.utils.toArray<HTMLElement>(".drop-sticker", root.current);
        gsap.set(items, { opacity: 0, scale: 1.35, rotation: (i) => TILT[i % TILT.length] * 3 });
        const batch = ScrollTrigger.batch(items, {
          start: "top 88%",
          once: true,
          onEnter: (els) =>
            gsap.to(els, {
              opacity: 1,
              scale: 1,
              rotation: 0,
              duration: 0.55,
              ease: "back.out(2.2)",
              stagger: 0.09,
              overwrite: true,
            }),
        });
        return () => batch.forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [drops.length] },
  );

  if (!drops.length) return null;

  return (
    <section ref={root} aria-labelledby="drops-title" className="relative overflow-hidden bg-mint py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="drops-title" className="font-display text-[clamp(3.6rem,9vw,8rem)] leading-[0.85]">
            Fresh drops
          </h2>
          <Link href="/shop?sort=new" className="btn btn-ghost">
            See everything new
          </Link>
        </div>

        {/* The sheet */}
        <ul className="mt-10 grid grid-cols-1 gap-x-4 gap-y-8 min-[360px]:grid-cols-2 rounded-[40px] bg-white/45 p-5 border-2 border-dashed border-grape/20 sm:grid-cols-3 md:p-10 lg:grid-cols-4">
          {drops.map((p, i) => (
            <li key={p.slug} className="drop-sticker" style={{ rotate: `${TILT[i % TILT.length]}deg` }}>
              <Link
                href={`/shop/${p.slug}`}
                className="group block rounded-[28px] bg-white p-2.5 shadow-[0_3px_0_0_rgb(43_17_64/0.12)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-gum)] hover:-translate-y-2 hover:rotate-2 hover:shadow-[8px_14px_0_0_rgb(43_17_64/0.2)]"
              >
                <div
                  className="relative aspect-[4/5] overflow-hidden rounded-[20px]"
                  style={{ background: p.stage }}
                >
                  <span className="absolute inset-[11%] flex items-center justify-center">
                    <ProductVisual product={p} decorative sizes="(min-width: 1024px) 22vw, 45vw" className="size-full transition-transform duration-500 ease-[var(--ease-gum)] group-hover:scale-105 group-hover:-rotate-3" />
                  </span>
                  {/* peeling corner */}
                  <span
                    aria-hidden
                    className="absolute right-0 bottom-0 size-0 bg-[linear-gradient(135deg,transparent_50%,#fff_50%)] shadow-[-3px_-3px_6px_rgb(43_17_64/0.15)] transition-all duration-300 group-hover:size-12"
                  />
                </div>
                <span className="block px-2 pt-3 font-semibold leading-tight">{p.name}</span>
                <span className="flex flex-wrap items-baseline justify-between gap-x-2 px-2 pt-0.5 pb-1 text-sm">
                  <span className="whitespace-nowrap opacity-65">{CATEGORY_LABEL[p.category].one}</span>
                  <Price value={p.price} was={wasPrice(p.category)} className="whitespace-nowrap font-semibold" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
