import { TEXT_COLORS } from "@/config/customization";
import type { Customization, TextLayer } from "@/lib/types";

export type PrintArea = { x: number; y: number; w: number; h: number; rx?: number };

/** Font settings shared by the SVG renderer and the editor's hit boxes. */
export const TEXT_FONT = {
  bubble: { family: "var(--font-bagel), sans-serif", weight: 400, variation: undefined },
  outline: { family: "var(--font-bagel), sans-serif", weight: 400, variation: undefined },
  clean: { family: "var(--font-instrument), sans-serif", weight: 700, variation: '"wdth" 80' },
} as const;

export const textHex = (id: TextLayer["color"]) => TEXT_COLORS.find((c) => c.id === id)?.hex ?? "#2B1140";

/**
 * Renders a customer's layers into a product's print area (SVG user units).
 * What is drawn here is exactly what the customer placed: no extra halos or
 * effects, so the preview stays an honest picture of the print.
 */
export function CustomOverlay({
  custom,
  area,
  uid,
}: {
  custom: Customization;
  area: PrintArea;
  uid: string;
}) {
  const clip = `print-${uid}`;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <rect x={area.x} y={area.y} width={area.w} height={area.h} rx={area.rx ?? 0} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {custom.layers.map((layer) => {
          const cx = area.x + layer.x * area.w;
          const cy = area.y + layer.y * area.h;
          const transform = layer.rotation ? `rotate(${layer.rotation} ${cx} ${cy})` : undefined;

          if (layer.kind === "image") {
            const w = layer.width * area.w;
            const h = w * layer.aspect;
            return (
              <image
                key={layer.id}
                href={layer.src}
                x={cx - w / 2}
                y={cy - h / 2}
                width={w}
                height={h}
                preserveAspectRatio="none"
                transform={transform}
              />
            );
          }

          const font = TEXT_FONT[layer.style];
          const size = layer.size * area.w;
          const color = textHex(layer.color);
          const outline = layer.style === "outline";
          return (
            <text
              key={layer.id}
              x={cx}
              y={cy}
              transform={transform}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={font.family}
              fontWeight={font.weight}
              fontSize={size}
              fill={outline ? "none" : color}
              stroke={outline ? color : "none"}
              strokeWidth={outline ? Math.max(1.5, size * 0.06) : 0}
              strokeLinejoin="round"
              style={{ fontVariationSettings: font.variation, whiteSpace: "pre" }}
            >
              {layer.text}
            </text>
          );
        })}
      </g>
    </g>
  );
}
