"use client";

import Link from "next/link";
import { useRef } from "react";
import { HeroSpotlight } from "./HeroSpotlight";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

// The intro plays once per visit; returning to the page shows the composed scene.
let introPlayed = false;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        const eyeWrap = q(".hero-eye-wrap")[0] as HTMLElement;
        const blink = q(".hero-blink")[0] as HTMLElement;

        // ── 1. Opening sequence (≈1.4s, CTAs usable from the first frame) ──
        if (!introPlayed) {
          introPlayed = true;
          const intro = gsap.timeline({ defaults: { ease: "back.out(1.8)" } });
          intro
            .from(q(".hero-letter"), {
              yPercent: 105,
              scaleY: 1.5,
              scaleX: 0.75,
              transformOrigin: "50% 100%",
              duration: 0.85,
              stagger: 0.07,
            })
            .from(blink, { scale: 0, duration: 0.6, ease: "back.out(3)" }, 0.45)
            .to(blink, { scaleY: 0.14, duration: 0.09, ease: "power2.in" }, 1.05)
            .to(blink, { scaleY: 1, duration: 0.25, ease: "back.out(3)" }, 1.15)
            // the spotlight product pops up onto the letters
            .from(q(".hero-item"), { yPercent: 50, scale: 0.6, opacity: 0, transformOrigin: "50% 100%", duration: 0.8 }, 0.55)
            .from(q(".hero-reveal"), { y: 28, opacity: 0, duration: 0.6, stagger: 0.07, ease: "power3.out" }, 0.05)
            .from(q(".hero-cue"), { scale: 0, rotation: -90, duration: 0.7 }, 0.9);
        }

        // ── 2. Idle: the eye winks every few seconds ──
        // ── and the spotlight product answers with a tiny hop ──
        const wink = gsap
          .timeline({ repeat: -1, repeatDelay: 3.6, delay: 2.4 })
          .to(blink, { scaleY: 0.14, duration: 0.08, ease: "power2.in" })
          .to(blink, { scaleY: 1, duration: 0.24, ease: "back.out(3)" })
          .to(q(".hero-item"), { y: -16, duration: 0.18, ease: "power2.out" }, 0.12)
          .to(q(".hero-item"), { y: 0, duration: 0.45, ease: "bounce.out" }, 0.3);

        // ── 3. Signature scroll ──
        // The eye leaves its letter, floats to the middle of the screen, winks
        // at you, then swallows the screen and becomes the tote stage.
        // The scene is CSS-sticky inside a taller track, so it stays put (and
        // usable) even without JS; GSAP only scrubs over the track's extra length.
        const scene = root.current!;
        // Untransformed centre of the eye, relative to the scene
        const eyeHome = () => {
          let x = eyeWrap.offsetWidth / 2;
          let y = eyeWrap.offsetHeight / 2;
          let el: HTMLElement | null = eyeWrap;
          while (el && el !== scene) {
            x += el.offsetLeft;
            y += el.offsetTop;
            el = el.offsetParent as HTMLElement | null;
          }
          return { x, y };
        };
        const lid = q(".hero-lid")[0] as HTMLElement;
        // At the centre the eye and a drawn lid form the WINKY glyph (● ◡).
        // `lid` is sized in CSS to the glyph's eye diameter.
        const glyphScale = () => lid.offsetWidth / eyeWrap.offsetWidth;
        const glyphX = () => scene.offsetWidth / 2 - lid.offsetWidth * 0.75 - eyeHome().x;
        const centerX = () => scene.offsetWidth / 2 - eyeHome().x;
        const centerY = () => scene.offsetHeight / 2 - eyeHome().y;
        const coverScale = () => (Math.hypot(scene.offsetWidth, scene.offsetHeight) * 1.08) / eyeWrap.offsetWidth;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: track.current,
            start: "top top",
            // Scrub ends one screen before the scene unsticks; during that last
            // screen the (blue) tote section slides up over the (now blue) hero.
            end: () => `bottom-=${scene.offsetHeight * 2} top`,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onToggle: (self) => {
              if (self.isActive) {
                wink.pause();
                gsap.set(blink, { scaleY: 1 });
                gsap.set(q(".hero-item"), { y: 0 });
              } else if (self.progress === 0) {
                wink.resume();
              }
            },
          },
        });

        tl.to(q(".hero-copy"), { y: -120, opacity: 0, duration: 0.22 }, 0)
          .to(q(".hero-cue"), { scale: 0, opacity: 0, duration: 0.12 }, 0)
          .to(q(".hero-shelf"), { yPercent: 140, duration: 0.3, ease: "power2.in" }, 0.02)
          .to(q(".hero-letter"), { yPercent: 115, duration: 0.34, stagger: { each: 0.035, from: "center" } }, 0.04)
          // float to centre and grow into the glyph's open eye
          .to(eyeWrap, { x: glyphX, y: centerY, scale: glyphScale, duration: 0.34, ease: "power2.inOut" }, 0.1)
          // the lid draws itself: ● ◡
          .fromTo(q(".hero-lid"), { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.4)
          .fromTo(q(".hero-lid path"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.12, ease: "power2.out" }, 0.4)
          .fromTo(q(".hero-glyph-note"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.1 }, 0.44)
          // hold, then the open eye takes over
          .to(q(".hero-lid, .hero-glyph-note"), { opacity: 0, scale: 0.6, duration: 0.08 }, 0.64)
          .to(eyeWrap, { x: centerX, duration: 0.1, ease: "power2.inOut" }, 0.64)
          .to(eyeWrap, { scale: coverScale, duration: 0.28, ease: "power3.in" }, 0.72)
          .set(q(".hero-bg-shift"), { opacity: 1 }, 1);

        // ── 4. Pointer: the eye watches the cursor ──
        const cleanups: (() => void)[] = [];
        if (window.matchMedia(MQ.finePointer).matches) {
          const movers = q<HTMLElement>("[data-depth]").map((el) => ({
            depth: Number(el.dataset.depth),
            x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }),
            y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }),
          }));
          const onMove = (e: PointerEvent) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            movers.forEach((m) => {
              m.x(nx * m.depth);
              m.y(ny * m.depth);
            });
          };
          window.addEventListener("pointermove", onMove, { passive: true });
          cleanups.push(() => window.removeEventListener("pointermove", onMove));
        }
        return () => cleanups.forEach((c) => c());
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={track} className="relative motion-safe:h-[calc(max(100svh,560px)*2+90svh)]">
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="top-0 h-[100svh] min-h-[560px] overflow-hidden bg-gum text-grape motion-safe:sticky motion-reduce:relative"
    >
      {/* Copy */}
      <div className="hero-copy absolute inset-x-0 top-[calc(var(--header-h)+5vh)] z-30 px-5 md:top-[20vh] md:left-[5vw] md:right-auto md:max-w-[34rem] md:px-0">
        <h1 id="hero-title" className="hero-reveal font-display text-[clamp(2.5rem,5.2vw,4.9rem)] leading-[0.92]">
          <span className="sr-only">WINKY: </span>
          Phone cases and totes that wink back.
        </h1>
        <p className="hero-reveal mt-3 max-w-[30ch] text-base font-medium sm:mt-4 sm:text-lg md:text-xl">
          Original designs, loud on purpose. Pick one you love, or bring your own design.
        </p>
        <div className="hero-reveal mt-5 flex flex-wrap gap-3 sm:mt-6">
          <Link href="/shop" className="btn">
            Shop the collection <span className="wink-eye" aria-hidden />
          </Link>
          <Link href="/customize" className="btn btn-ghost">
            Customize yours
          </Link>
        </div>
      </div>

      {/* One product at a time, standing on the letters */}
      <HeroSpotlight />

      {/* The wordmark, sitting on the bottom edge */}
      <div
        aria-hidden
        className="font-display pointer-events-none absolute inset-x-0 bottom-[-0.2em] z-10 flex justify-center text-[31vw] leading-[0.8] tracking-[-0.03em] text-milk select-none"
      >
        <span className="hero-letter inline-block">w</span>
        <span className="relative inline-block">
          <span className="hero-letter inline-block">ı</span>
          <span className="hero-eye-wrap absolute top-[0.075em] left-1/2 z-20 -ml-[0.13em] block size-[0.26em]">
            <span data-depth="14" className="block size-full">
              <span className="hero-blink block size-full rounded-full bg-cobalt" />
            </span>
          </span>
        </span>
        <span className="hero-letter inline-block">n</span>
        <span className="hero-letter inline-block">k</span>
        <span className="hero-letter inline-block">y</span>
      </div>

      {/* Scroll cue: a sticker that spins and points down */}
      <div className="hero-cue absolute top-[calc(var(--header-h)+6vh)] right-[5vw] z-30 hidden size-28 md:block">
        <svg viewBox="0 0 120 120" className="size-full animate-spin-slow" aria-hidden>
          <defs>
            <path id="cue-circle" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
          </defs>
          <circle cx="60" cy="60" r="58" fill="var(--color-butter)" />
          <text fontSize="13.5" fontWeight="700" fill="var(--color-grape)" letterSpacing="2">
            <textPath href="#cue-circle">scroll for more winks • scroll for more winks •</textPath>
          </text>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto size-8 text-grape" aria-hidden>
          <path d="M12 4v15m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sr-only">Scroll down for more</span>
      </div>

      {/* The lid that completes the glyph mid-scroll (hidden until drawn) */}
      <div
        aria-hidden
        className="hero-lid pointer-events-none absolute opacity-0 top-[calc(50%-var(--d)*0.32)] left-[calc(50%+var(--d)*0.25)] z-20 aspect-[100/60] w-(--d) [--d:min(34vw,36svh)] md:[--d:min(27.4vw,48svh)] motion-reduce:hidden"
      >
        <svg viewBox="0 0 100 60" className="size-full overflow-visible">
          <path d="M6 12 Q50 74 94 12" pathLength={1} strokeDasharray="1" strokeDashoffset="1" stroke="var(--color-cobalt)" strokeWidth="15" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <p
        aria-hidden
        className="hero-glyph-note font-display pointer-events-none absolute inset-x-0 top-[calc(50%+var(--d)*0.62)] z-20 text-center text-[clamp(1.6rem,3vw,2.6rem)] text-grape opacity-0 [--d:min(34vw,36svh)] md:[--d:min(27.4vw,48svh)] motion-reduce:hidden"
      >
        psst… totes this way
      </p>

      {/* Final frame of the scroll: section is fully blue-raspberry */}
      <div aria-hidden className="hero-bg-shift pointer-events-none absolute inset-0 z-40 bg-cobalt opacity-0" />
    </section>
    </div>
  );
}
