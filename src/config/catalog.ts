/**
 * Options offered in the product dashboard.
 */

/** Showcase background colours a product can be presented on. */
export const STAGE_COLORS = [
  { id: "butter", label: "Lemon drop", hex: "#FFE15A" },
  { id: "gum", label: "Bubblegum", hex: "#FF4F9A" },
  { id: "blush", label: "Strawberry milk", hex: "#FFD1E4" },
  { id: "mint", label: "Spearmint", hex: "#9AF0C8" },
  { id: "cobalt", label: "Blue raspberry", hex: "#3D4BFF" },
  { id: "grape", label: "Grape", hex: "#2B1140" },
] as const;

export const DEFAULT_STAGE = { tote: "#FFE15A", case: "#FF4F9A" } as const;

/**
 * Phone models suggested in the dashboard and offered for custom cases.
 * Edit to match what you actually produce; you can also type any model
 * directly on a product.
 */
export const PHONE_MODEL_SUGGESTIONS = [
  "iPhone 16",
  "iPhone 16 Plus",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
  "iPhone 15",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "Galaxy S25",
  "Galaxy S25 Ultra",
  "Galaxy A55",
] as const;

/** Upload limits for product photos */
export const PRODUCT_IMAGE = {
  accept: ["image/png", "image/jpeg", "image/webp"] as const,
  maxFileMb: 15,
  /** Longest side after processing */
  maxPx: 2000,
  maxPerProduct: 8,
} as const;
