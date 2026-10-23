/**
 * Draws an illustrated sample design into a w×h print area (user units).
 * Patterns tile; compositions (bigwink, drips) are laid out to the area.
 */
import type { ReactNode } from "react";
import type { Artwork } from "@/lib/types";
import { Bubble, Cherry, Daisy, Egg, Gumball, Heart, Sparkle, Star, WinkFace } from "./motifs";

type Props = {
  art: Artwork;
  w: number;
  h: number;
  uid: string;
  /** Pattern scale; totes print larger than cases */
  scale?: number;
};

function Tile({
  id,
  size,
  scale,
  bg,
  children,
  height,
}: {
  id: string;
  size: number;
  height?: number;
  scale: number;
  bg: string;
  children: ReactNode;
}) {
  const th = height ?? size;
  return (
    <pattern id={id} width={size} height={th} patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
      <rect width={size} height={th} fill={bg} />
      {children}
    </pattern>
  );
}

export function ArtFill({ art, w, h, uid, scale = 1 }: Props) {
  const { base, a, b, ink } = art.palette;
  const pid = `p-${uid}`;
  const fill = <rect width={w} height={h} fill={`url(#${pid})`} />;

  switch (art.kind) {
    case "winks":
      return (
        <>
          <defs>
            <Tile id={pid} size={76} scale={scale} bg={base}>
              <WinkFace eye={a} smile={b} transform="translate(19 19) rotate(-10)" />
              <WinkFace eye={b} smile={a} transform="translate(57 57) rotate(12)" />
            </Tile>
          </defs>
          {fill}
        </>
      );
    case "gumballs":
      return (
        <>
          <defs>
            <Tile id={pid} size={100} scale={scale} bg={base}>
              <Gumball fill={a} transform="translate(20 20)" />
              <Gumball fill={b} transform="translate(62 17) scale(.85)" />
              <Gumball fill={ink} transform="translate(84 58) scale(1.05)" />
              <Gumball fill={a} transform="translate(44 62) scale(.95)" />
              <Gumball fill={b} transform="translate(16 84) scale(1.05)" />
              <Gumball fill={ink} transform="translate(72 86) scale(.7)" />
            </Tile>
          </defs>
          {fill}
        </>
      );
    case "cherries":
      return (
        <>
          <defs>
            <Tile id={pid} size={92} scale={scale} bg={base}>
              <Cherry fruit={a} leaf={b} stem={ink} transform="translate(23 25) rotate(-8)" />
              <Cherry fruit={a} leaf={b} stem={ink} transform="translate(69 70) rotate(14)" />
            </Tile>
          </defs>
          {fill}
        </>
      );
    case "harlequin":
      return (
        <>
          <defs>
            <Tile id={pid} size={60} scale={scale} bg={b}>
              <path d="M30 0 L60 30 L30 60 L0 30 Z" fill={a} />
              <circle cx={30} cy={30} r={3.4} fill={ink} />
              <circle cx={0} cy={0} r={3.4} fill={ink} />
              <circle cx={60} cy={0} r={3.4} fill={ink} />
              <circle cx={0} cy={60} r={3.4} fill={ink} />
              <circle cx={60} cy={60} r={3.4} fill={ink} />
            </Tile>
          </defs>
          <rect width={w} height={h} fill={base} />
          {fill}
        </>
      );
    case "ripple":
      return (
        <>
          <defs>
            <Tile id={pid} size={80} height={52} scale={scale} bg={base}>
              <path d="M-2 13 Q20 -1 40 13 T82 13" stroke={a} strokeWidth={10} fill="none" />
              <path d="M-2 39 Q20 25 40 39 T82 39" stroke={b} strokeWidth={10} fill="none" />
            </Tile>
          </defs>
          {fill}
        </>
      );
    case "bubbles":
      return (
        <>
          <defs>
            <Tile id={pid} size={120} scale={scale} bg={base}>
              <Bubble ring={b} fill={a} transform="translate(28 30)" />
              <Bubble ring={b} fill={a} transform="translate(86 24) scale(.62)" />
              <Bubble ring={b} fill={a} transform="translate(80 82) scale(1.25)" />
              <Bubble ring={b} fill={a} transform="translate(26 92) scale(.75)" />
              <circle cx={56} cy={58} r={3} fill={ink} />
              <circle cx={108} cy={52} r={2.5} fill={ink} />
            </Tile>
          </defs>
          {fill}
        </>
      );
    case "daisies":
      return (
        <>
          <defs>
            <Tile id={pid} size={100} scale={scale} bg={base}>
              <Daisy petal={a} center={b} transform="translate(25 25) rotate(10)" />
              <Daisy petal={a} center={b} transform="translate(75 75) scale(.82) rotate(-12)" />
              <circle cx={78} cy={24} r={3} fill={ink} />
              <circle cx={22} cy={78} r={3} fill={ink} />
            </Tile>
          </defs>
          {fill}
        </>
      );
    case "hearts":
      return (
        <>
          <defs>
            <Tile id={pid} size={72} scale={scale} bg={base}>
              <Heart fill={a} transform="translate(18 18) rotate(-12)" />
              <Heart fill={b} transform="translate(54 54) rotate(12) scale(.9)" />
              <circle cx={54} cy={16} r={2.4} fill={ink} />
              <circle cx={16} cy={54} r={2.4} fill={ink} />
            </Tile>
          </defs>
          {fill}
        </>
      );
    case "stars":
      return (
        <>
          <defs>
            <Tile id={pid} size={92} scale={scale} bg={base}>
              <Star fill={a} transform="translate(24 24) rotate(-8)" />
              <Sparkle fill={b} transform="translate(70 66) scale(.8)" />
              <circle cx={70} cy={20} r={2.2} fill={ink} />
              <circle cx={22} cy={72} r={2.2} fill={ink} />
              <circle cx={48} cy={46} r={1.6} fill={ink} />
            </Tile>
          </defs>
          {fill}
        </>
      );
    case "sunny":
      return (
        <>
          <defs>
            <Tile id={pid} size={110} scale={scale} bg={base}>
              <Egg white={a} yolk={b} transform="translate(29 30) rotate(-14)" />
              <Egg white={a} yolk={b} transform="translate(82 84) rotate(32) scale(.9)" />
              <circle cx={84} cy={26} r={3} fill={ink} />
              <circle cx={24} cy={86} r={3} fill={ink} />
            </Tile>
          </defs>
          {fill}
        </>
      );
    case "drips": {
      const band = h * 0.24;
      const n = Math.max(5, Math.round(w / 52));
      const step = w / n;
      let d = `M0 0 H${w} V${band}`;
      for (let i = n; i > 0; i--) {
        const x1 = i * step;
        const x0 = x1 - step;
        const len = band * (0.35 + (((i * 7919) % 11) / 11) * 0.9);
        const mid = (x0 + x1) / 2;
        const r = step * 0.28;
        d += ` L${x1 - step * 0.05} ${band}`;
        d += ` C${mid + r * 1.1} ${band} ${mid + r} ${band + len - r} ${mid + r} ${band + len}`;
        d += ` A${r} ${r} 0 0 1 ${mid - r} ${band + len}`;
        d += ` C${mid - r} ${band + len - r} ${mid - r * 1.1} ${band} ${x0 + step * 0.05} ${band}`;
      }
      d += " Z";
      const sprinkles = Array.from({ length: Math.round((w * h) / 2600) }, (_, i) => {
        const x = ((i * 9301 + 49297) % 233280) / 233280;
        const y = ((i * 4271 + 1031) % 23328) / 23328;
        return { x: 14 + x * (w - 28), y: band * 2.2 + y * (h - band * 2.4), r: (i * 47) % 180 };
      });
      return (
        <>
          <rect width={w} height={h} fill={base} />
          {sprinkles.map((s, i) => (
            <rect
              key={i}
              x={s.x - 7}
              y={s.y - 2.5}
              width={14}
              height={5}
              rx={2.5}
              fill={i % 3 === 0 ? b : i % 3 === 1 ? a : ink}
              transform={`rotate(${s.r} ${s.x} ${s.y})`}
            />
          ))}
          <path d={d} fill={a} />
        </>
      );
    }
    case "bigwink": {
      const s = Math.min(w, h) / 46;
      return (
        <>
          <rect width={w} height={h} fill={base} />
          <g transform={`translate(${w / 2} ${h * 0.5}) scale(${s})`}>
            <circle cx={-9} cy={-5} r={5.8} fill={b} />
            <path d="M3 -7 Q9 -1 15 -7" stroke={b} strokeWidth={4.4} fill="none" strokeLinecap="round" />
            <path d="M-12 7 Q1 18 14 7" stroke={b} strokeWidth={4.4} fill="none" strokeLinecap="round" />
            <circle cx={-16} cy={4} r={2.6} fill={a} />
            <circle cx={19} cy={4} r={2.6} fill={a} />
          </g>
        </>
      );
    }
    case "plain":
    default:
      return <rect width={w} height={h} fill={base} />;
  }
}
