/**
 * The WINKY motif library used by the illustrated sample products. Every
 * shape is drawn centred on (0,0) at roughly 40×40 units.
 */
import type { SVGProps } from "react";

type G = SVGProps<SVGGElement>;

export function WinkFace({ eye, smile, ...rest }: { eye: string; smile?: string } & G) {
  return (
    <g {...rest}>
      <circle cx={-9} cy={-5} r={5.5} fill={eye} />
      <path d="M3 -7 Q9 -1 15 -7" stroke={eye} strokeWidth={4.2} fill="none" strokeLinecap="round" />
      <path d="M-11 6 Q1 17 13 6" stroke={smile ?? eye} strokeWidth={4.2} fill="none" strokeLinecap="round" />
    </g>
  );
}

export const HEART_PATH =
  "M0,14 C-6,9 -16,3 -16,-5 C-16,-11 -11,-15 -6,-15 C-3,-15 -1,-13 0,-11 C1,-13 3,-15 6,-15 C11,-15 16,-11 16,-5 C16,3 6,9 0,14 Z";

export const SPARKLE_PATH =
  "M0,-16 C2,-4 4,-2 16,0 C4,2 2,4 0,16 C-2,4 -4,2 -16,0 C-4,-2 -2,-4 0,-16 Z";

export const STAR_PATH = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 16 : 7;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
})();

export function Heart({ fill, ...rest }: { fill: string } & G) {
  return (
    <g {...rest}>
      <path d={HEART_PATH} fill={fill} />
    </g>
  );
}

export function Star({ fill, ...rest }: { fill: string } & G) {
  return (
    <g {...rest}>
      <path d={STAR_PATH} fill={fill} strokeLinejoin="round" stroke={fill} strokeWidth={3} />
    </g>
  );
}

export function Sparkle({ fill, ...rest }: { fill: string } & G) {
  return (
    <g {...rest}>
      <path d={SPARKLE_PATH} fill={fill} />
    </g>
  );
}

export function Cherry({ fruit, leaf, stem, ...rest }: { fruit: string; leaf: string; stem: string } & G) {
  return (
    <g {...rest}>
      <path d="M-8 6 Q-4 -8 3 -15 M8 8 Q6 -6 3 -15" stroke={stem} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <ellipse cx={9} cy={-15} rx={7} ry={3.6} fill={leaf} transform="rotate(-24 9 -15)" />
      <circle cx={-8} cy={9} r={7.5} fill={fruit} />
      <circle cx={8} cy={11} r={7.5} fill={fruit} />
      <circle cx={-10.5} cy={6.5} r={2} fill="#fff" opacity={0.75} />
      <circle cx={5.5} cy={8.5} r={2} fill="#fff" opacity={0.75} />
    </g>
  );
}

export function Daisy({ petal, center, ...rest }: { petal: string; center: string } & G) {
  return (
    <g {...rest}>
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx={0} cy={-10} rx={5.2} ry={9.5} fill={petal} transform={`rotate(${i * 45})`} />
      ))}
      <circle r={6.5} fill={center} />
    </g>
  );
}

export function Egg({ white, yolk, ...rest }: { white: string; yolk: string } & G) {
  return (
    <g {...rest}>
      <path
        d="M-4 -19 C8 -21 19 -12 18 -2 C22 8 12 19 1 17 C-9 21 -20 12 -18 1 C-22 -9 -14 -18 -4 -19 Z"
        fill={white}
      />
      <circle cx={0} cy={0} r={7.5} fill={yolk} />
      <circle cx={-2.5} cy={-2.5} r={2.2} fill="#fff" opacity={0.7} />
    </g>
  );
}

export function Bubble({ ring, fill, ...rest }: { ring: string; fill: string } & G) {
  return (
    <g {...rest}>
      <circle r={15} fill={fill} stroke={ring} strokeWidth={3} />
      <path d="M-9 -4 A10 10 0 0 1 -3 -10" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  );
}

export function Gumball({ fill, ...rest }: { fill: string } & G) {
  return (
    <g {...rest}>
      <circle r={13} fill={fill} />
      <circle cx={-4.5} cy={-4.5} r={3.4} fill="#fff" opacity={0.7} />
    </g>
  );
}
