import { PLAIN_BASES, PRINT_AREA_CM, TEXT_COLORS, TEXT_STYLES } from "@/config/customization";
import type { Category, Customization, DesignLayer } from "./types";

const label = <T extends { id: string; label: string }>(list: readonly T[], id: string) =>
  list.find((x) => x.id === id)?.label ?? id;

const pct = (v: number) => `${Math.round(v * 100)}%`;
const cm = (v: number) => `${(Math.round(v * 10) / 10).toFixed(1)} cm`;

export function layerTitle(layer: DesignLayer) {
  return layer.kind === "image" ? `Image “${layer.name}”` : `Text “${layer.text}”`;
}

/**
 * Exact placement of one layer, in the terms production needs:
 * where its centre sits, how big it is and how it's rotated.
 * Uses centimetres once PRINT_AREA_CM is configured, otherwise percentages
 * of the print area.
 */
export function describePlacement(layer: DesignLayer, category: Category) {
  const area = PRINT_AREA_CM[category];
  const size = layer.kind === "image" ? layer.width : layer.size;
  const sizeLabel = layer.kind === "image" ? "Width" : "Text height";
  const rows: { k: string; v: string }[] = [];
  if (area) {
    rows.push({ k: "Centre", v: `${cm(layer.x * area.width)} from left, ${cm(layer.y * area.height)} from top` });
    rows.push({ k: sizeLabel, v: cm(size * area.width) });
  } else {
    rows.push({ k: "Centre", v: `${pct(layer.x)} from left, ${pct(layer.y)} from top of the print area` });
    rows.push({ k: sizeLabel, v: `${pct(size)} of the print area's width` });
  }
  rows.push({ k: "Rotation", v: `${Math.round(layer.rotation)}°` });
  if (layer.kind === "text") {
    rows.push({ k: "Style", v: `${label(TEXT_STYLES, layer.style)}, ${label(TEXT_COLORS, layer.color).toLowerCase()}` });
  } else {
    rows.push({ k: "Original file", v: `${layer.originalWidth} × ${layer.originalHeight} px` });
  }
  return rows;
}

/** Short summary for the cart: product color plus one line per layer. */
export function describeCustom(c: Customization, category: Category) {
  const color = PLAIN_BASES[category].find((b) => b.id === c.baseId)?.label ?? "Plain";
  const rows: { k: string; v: string }[] = [{ k: "Color", v: color }];
  const images = c.layers.filter((l) => l.kind === "image");
  const texts = c.layers.filter((l) => l.kind === "text");
  if (images.length) rows.push({ k: images.length > 1 ? "Images" : "Image", v: images.map((l) => l.name).join(", ") });
  if (texts.length) rows.push({ k: "Text", v: texts.map((l) => `“${l.text}”`).join(", ") });
  if (c.layers.length) rows.push({ k: "Placement", v: "Saved exactly as you placed it" });
  return rows;
}
