"use client";

import { useId } from "react";
import type { Artwork, Customization } from "@/lib/types";
import { shade } from "@/lib/color";
import { ArtFill } from "./ArtFill";
import { CustomOverlay } from "./CustomOverlay";

/**
 * Drawn plain phone case (viewBox 300×612), used by the customizer and as a
 * stand-in where no product photo exists.
 * The camera opening is deliberately generic: real cutouts depend on the
 * phone model and should come from product photography.
 */
export const CASE_VIEWBOX = { w: 300, h: 612 };
/** The whole back of the case is printable; the camera opening sits on top. */
export const CASE_PRINT = { x: 4, y: 4, w: 292, h: 604, rx: 50 };
export const CASE_CAMERA = { x: 22, y: 22, w: 118, h: 122, rx: 34 };

export function CaseMockup({
  color,
  art,
  custom,
  view = "back",
  title,
  className,
}: {
  color?: string;
  /** Illustrated sample design (sample products only) */
  art?: Artwork;
  custom?: Customization;
  view?: "back" | "front";
  title?: string;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const base = art?.palette.base ?? color ?? "#FFE3EE";
  const rim = shade(base, 0.15);

  return (
    <svg
      viewBox={`0 0 ${CASE_VIEWBOX.w} ${CASE_VIEWBOX.h}`}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <clipPath id={`case-${uid}`}>
          <rect x={4} y={4} width={292} height={604} rx={50} />
        </clipPath>
        <linearGradient id={`gloss-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.32" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.33" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id={`lens-${uid}`} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#4a2a63" />
          <stop offset="1" stopColor="#1a0a26" />
        </radialGradient>
      </defs>

      {view === "back" ? (
        <g clipPath={`url(#case-${uid})`}>
          {art ? <ArtFill art={art} w={300} h={612} uid={uid} /> : <rect width={300} height={612} fill={base} />}
          {custom && <CustomOverlay custom={custom} area={CASE_PRINT} uid={`${uid}c`} />}
          <rect width={300} height={612} fill={`url(#gloss-${uid})`} />
        </g>
      ) : (
        <g>
          <rect x={4} y={4} width={292} height={604} rx={50} fill={base} />
          <rect x={15} y={15} width={270} height={582} rx={40} fill="#1a0a26" />
          <rect x={15} y={15} width={270} height={582} rx={40} fill={`url(#gloss-${uid})`} />
        </g>
      )}

      <rect x={5.5} y={5.5} width={289} height={601} rx={48.5} fill="none" stroke={rim} strokeWidth={3} />

      {view === "back" && (
        <g>
          <rect x={22} y={22} width={118} height={122} rx={34} fill={shade(base, 0.2)} />
          <rect x={27} y={27} width={108} height={112} rx={30} fill={`url(#lens-${uid})`} />
        </g>
      )}
    </svg>
  );
}
