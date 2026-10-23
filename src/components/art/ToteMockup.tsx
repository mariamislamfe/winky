"use client";

import { useId } from "react";
import type { Artwork, Customization } from "@/lib/types";
import { shade } from "@/lib/color";
import { ArtFill } from "./ArtFill";
import { CustomOverlay } from "./CustomOverlay";

/**
 * Drawn plain tote (viewBox 400×540), used by the customizer and as a
 * stand-in where no product photo exists.
 */
const BODY = "M50 176 L350 176 L364 494 Q365 516 343 516 L57 516 Q35 516 36 494 Z";
export const TOTE_VIEWBOX = { w: 400, h: 540 };
/** Printable panel on the front of the tote, in viewBox units */
export const TOTE_PRINT = { x: 76, y: 212, w: 248, h: 280 };

export function ToteMockup({
  color,
  art,
  custom,
  title,
  className,
}: {
  color?: string;
  /** Illustrated sample design (sample products only) */
  art?: Artwork;
  custom?: Customization;
  title?: string;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const base = art?.palette.base ?? color ?? "#F4E6D4";
  const strap = shade(base, 0.12);
  // Most samples print all over; the big wink sits on a panel
  const panel = art?.kind === "bigwink";

  return (
    <svg
      viewBox={`0 0 ${TOTE_VIEWBOX.w} ${TOTE_VIEWBOX.h}`}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <clipPath id={`body-${uid}`}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={`shade-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id={`fold-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.1" />
          <stop offset="0.12" stopColor="#000" stopOpacity="0" />
          <stop offset="0.9" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* back handle */}
      <path d="M142 180 C140 46, 260 46, 258 180" stroke={shade(strap, 0.18)} strokeWidth={20} fill="none" strokeLinecap="round" />

      {/* body + print */}
      <g clipPath={`url(#body-${uid})`}>
        {art && !panel ? (
          <g transform="translate(36 176)">
            <ArtFill art={art} w={330} h={342} uid={uid} scale={1.35} />
          </g>
        ) : (
          <rect x={36} y={176} width={330} height={342} fill={base} />
        )}
        {art && panel && (
          <g transform={`translate(${TOTE_PRINT.x} ${TOTE_PRINT.y})`}>
            <ArtFill art={art} w={TOTE_PRINT.w} h={TOTE_PRINT.h} uid={`${uid}p`} />
          </g>
        )}
        {custom && <CustomOverlay custom={custom} area={TOTE_PRINT} uid={`${uid}c`} />}
        {/* hem */}
        <rect x={0} y={176} width={400} height={26} fill="#000" opacity={0.07} />
        <line x1={40} x2={360} y1={197} y2={197} stroke="#000" strokeOpacity={0.22} strokeWidth={1.6} strokeDasharray="6 5" />
        <rect x={0} y={176} width={400} height={342} fill={`url(#shade-${uid})`} />
        <rect x={0} y={176} width={400} height={342} fill={`url(#fold-${uid})`} />
        <path d="M150 210 Q146 360 156 512" stroke="#000" strokeOpacity={0.05} strokeWidth={10} fill="none" />
        <path d="M262 206 Q268 340 252 512" stroke="#fff" strokeOpacity={0.07} strokeWidth={14} fill="none" />
      </g>

      {/* front handle with box stitches */}
      <path d="M118 196 C112 22, 288 22, 282 196" stroke={strap} strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d="M118 196 C112 22, 288 22, 282 196" stroke="#000" strokeOpacity={0.18} strokeWidth={1.4} strokeDasharray="5 5" fill="none" />
      {[118, 282].map((x) => (
        <g key={x}>
          <rect x={x - 13} y={178} width={26} height={30} rx={3} fill={strap} />
          <path
            d={`M${x - 8} ${183} h16 v20 h-16 Z M${x - 8} ${183} l16 20 M${x + 8} ${183} l-16 20`}
            stroke="#000"
            strokeOpacity={0.22}
            strokeWidth={1.3}
            fill="none"
          />
        </g>
      ))}
    </svg>
  );
}
