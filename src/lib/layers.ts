import type { TextColorId, TextStyleId } from "@/config/customization";
import type { PreparedImage } from "./image";
import type { ImageLayer, TextLayer } from "./types";

export const layerId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `l-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Text size (fraction of print width) that fits a string across ~80% of the area. */
export function fitTextSize(text: string) {
  return Math.min(0.26, 0.8 / Math.max(1, text.length * 0.62));
}

export function newTextLayer(
  text: string,
  opts: { style?: TextStyleId; color?: TextColorId; y?: number } = {},
  /** Pass a fixed id when rendering on the server (random ids can't be prerendered) */
  id: string = layerId(),
): TextLayer {
  return {
    id,
    kind: "text",
    text,
    style: opts.style ?? "bubble",
    color: opts.color ?? "grape",
    size: fitTextSize(text),
    x: 0.5,
    y: opts.y ?? 0.5,
    rotation: 0,
  };
}

/** Fit a new upload inside the print area (60% wide, or shorter if it's tall). */
export function newImageLayer(img: PreparedImage, areaAspect: number): ImageLayer {
  const maxWidthByHeight = (0.7 * areaAspect) / img.aspect;
  return {
    id: layerId(),
    kind: "image",
    ...img,
    width: Math.min(0.6, maxWidthByHeight),
    x: 0.5,
    y: 0.5,
    rotation: 0,
  };
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Keep rotations in (-180, 180] */
export const normalizeAngle = (deg: number) => {
  let a = ((deg + 180) % 360 + 360) % 360 - 180;
  if (a === -180) a = 180;
  return Math.round(a * 10) / 10;
};

export const LIMITS = {
  imageWidth: [0.05, 1.6] as const,
  textSize: [0.03, 0.6] as const,
};
