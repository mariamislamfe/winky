import type { Category } from "@/lib/types";

/**
 * Personalization options offered in the customizer.
 *
 * Customers upload their own artwork and/or add text, then place each layer
 * exactly where they want it on the product. These values are a configurable
 * starting point, not confirmed manufacturing capabilities: edit them here
 * and the customizer, preview, cart summary and validation all follow.
 */

export const UPLOAD = {
  /** Accepted file types for customer artwork */
  accept: ["image/png", "image/jpeg", "image/webp"] as const,
  acceptLabel: "PNG, JPG or WebP",
  maxFileMb: 10,
  /**
   * A downscaled copy is kept in the browser for the live preview and the
   * cart; the original is uploaded to the server for printing.
   */
  previewMaxPx: 1000,
} as const;

/** Most layers (uploads + text) a single item can have */
export const MAX_LAYERS = 6;

export const CUSTOM_TEXT = {
  maxLength: 24,
  /** Characters accepted in custom text. Keep in sync with your print vendor. */
  allowedPattern: /^[\p{L}\p{N} .,!?&'♥@#-]*$/u,
} as const;

export const TEXT_STYLES = [
  { id: "bubble", label: "Bubble" },
  { id: "clean", label: "Clean" },
  { id: "outline", label: "Outline" },
] as const;
export type TextStyleId = (typeof TEXT_STYLES)[number]["id"];

export const TEXT_COLORS = [
  { id: "grape", label: "Grape", hex: "#2B1140" },
  { id: "milk", label: "Strawberry milk", hex: "#FFF0F5" },
  { id: "gum", label: "Bubblegum", hex: "#FF4F9A" },
  { id: "cobalt", label: "Blue raspberry", hex: "#3D4BFF" },
  { id: "butter", label: "Lemon drop", hex: "#FFE15A" },
  { id: "mint", label: "Spearmint", hex: "#9AF0C8" },
] as const;
export type TextColorId = (typeof TEXT_COLORS)[number]["id"];

/** Product colors a customer can print on. */
export const PLAIN_BASES: Record<Category, { id: string; label: string; color: string }[]> = {
  tote: [
    { id: "plain-natural", label: "Natural", color: "#F4E6D4" },
    { id: "plain-gum", label: "Bubblegum", color: "#FF8DBE" },
    { id: "plain-grape", label: "Grape", color: "#2B1140" },
  ],
  case: [
    { id: "plain-milk", label: "Strawberry milk", color: "#FFE3EE" },
    { id: "plain-clear", label: "Frost", color: "#F2F2F6" },
    { id: "plain-cobalt", label: "Blue raspberry", color: "#3D4BFF" },
    { id: "plain-butter", label: "Lemon drop", color: "#FFE15A" },
  ],
};

/**
 * Real-world size of each printable area, in centimetres.
 * `null` until the print specs are confirmed with Zink. While null, placements
 * are reported as percentages of the print area; once set, the cart and
 * customizer summary also report them in centimetres.
 */
export const PRINT_AREA_CM: Record<Category, { width: number; height: number } | null> = {
  tote: null,
  case: null,
};
