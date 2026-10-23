"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/** Two giant eyes. Scroll to the end and one of them winks. */
export function FinalCta() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        gsap
          .timeline({
            scrollTrigger: { trigger: root.current, start: "top 75%", end: "center 55%", scrub: 0.4 },
          })
          .from(q(".cta-eye"), { scale: 0.2, stagger: 0.1, ease: "back.out(2)", duration: 0.5 })
          .to(q(".cta-eye-open-r"), { scaleY: 0.06, duration: 0.3, ease: "power2.in" }, 0.6)
          .to(q(".cta-eye-open-r"), { opacity: 0, duration: 0.08 }, 0.82)
          .fromTo(q(".cta-lid"), { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.75)
          .fromTo(q(".cta-lid"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3 }, 0.75);

        // Left eye watches the cursor
        if (window.matchMedia(MQ.finePointer).matches) {
          const px = gsap.quickTo(q(".cta-pupil"), "x", { duration: 0.5, ease: "power3" });
          const py = gsap.quickTo(q(".cta-pupil"), "y", { duration: 0.5, ease: "power3" });
          const onMove = (e: PointerEvent) => {
            const r = root.current!.getBoundingClientRect();
            px(gsap.utils.clamp(-1, 1, (e.clientX - r.left) / r.width - 0.5) * 60);
            py(gsap.utils.clamp(-1, 1, (e.clientY - r.top) / r.height - 0.5) * 60);
          };
          window.addEventListener("pointermove", onMove, { passive: true });
          return () => window.removeEventListener("pointermove", onMove);
        }
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="cta-title" className="relative overflow-hidden bg-gum pt-20 pb-24 text-grape md:pt-28 md:pb-32">
      <div aria-hidden className="mx-auto flex max-w-[900px] items-center justify-center gap-[6vw] px-5">
        <div className="cta-eye relative grid aspect-square w-[34vw] max-w-[300px] place-items-center rounded-full bg-milk">
          <span className="cta-pupil block size-[38%] rounded-full bg-grape" />
        </div>
        <div className="cta-eye relative grid aspect-square w-[34vw] max-w-[300px] place-items-center">
          <span className="cta-eye-open-r absolute inset-0 rounded-full bg-milk" />
          <svg viewBox="0 0 100 50" className="absolute top-[38%] w-full overflow-visible">
            <path
              className="cta-lid"
              opacity={0}
              d="M6 6 Q50 60 94 6"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset="1"
              stroke="var(--color-milk)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <div className="relative mx-auto mt-12 max-w-[1100px] px-5 text-center">
        <h2 id="cta-title" className="font-display text-[clamp(3.4rem,10vw,9rem)] leading-[0.86]">
          Go on,
          <br />
          wink back.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn">
            Shop the collection <span className="wink-eye" aria-hidden />
          </Link>
          <Link href="/customize" className="btn btn-ghost">
            Customize yours
          </Link>
        </div>
      </div>
    </section>
  );
}
