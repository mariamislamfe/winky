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
 * Shown on every phone case that doesn't have its own description
 * (including the "Your Case" customizer). Write a description on a product
 * in the dashboard to replace it for that one case.
 */
export const CASE_DESCRIPTION =
  "Enjoy full magnetic charging compatibility with a slim, flexible TPU case designed to highlight your phone's natural look. The vibrant UV print covers only the back, keeping the flexible sides totally transparent and clear.";

/**
 * Every phone model cases are made for, by brand. Entries with "/" are one
 * case that fits several phones. Sorted automatically, so add new models
 * anywhere in their brand. Customers whose phone isn't listed can type it
 * ("Other: …").
 */
const MODELS_BY_BRAND: { brand: string; aliases: string; models: string[] }[] = [
  {
    brand: "iPhone",
    aliases: "apple",
    models: [
      "iPhone 6", "iPhone 6 Plus", "iPhone 7", "iPhone 7 Plus", "iPhone 8 Plus", "iPhone X / XS", "iPhone XR", "iPhone XS Max",
      "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone 12", "iPhone 12 mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
      "iPhone 13", "iPhone 13 mini", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro",
      "iPhone 14 Pro Max", "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Pro", "iPhone 16 Pro Max",
    ],
  },
  {
    brand: "Samsung",
    aliases: "galaxy",
    models: [
      "Samsung A02 / M02", "Samsung A022 / M02s", "Samsung A03s", "Samsung A04", "Samsung A05s", "Samsung A10", "Samsung A10s",
      "Samsung A12 / M12", "Samsung A13 4G", "Samsung A13 5G / A04s", "Samsung A14", "Samsung A15", "Samsung A20 / A30 / M10s",
      "Samsung A20s", "Samsung A21", "Samsung A21s", "Samsung A22 4G", "Samsung A22 5G", "Samsung A23", "Samsung A24",
      "Samsung A30s", "Samsung A31 / A8", "Samsung A32 4G", "Samsung A32 5G", "Samsung A33", "Samsung A34", "Samsung A35 5G",
      "Samsung A51 / M40s", "Samsung A52", "Samsung A53", "Samsung A54", "Samsung A70 / A70s", "Samsung A71", "Samsung A72",
      "Samsung A73", "Samsung A80", "Samsung M11", "Samsung M30s", "Samsung M31", "Samsung M32", "Samsung M33 5G", "Samsung M51",
      "Samsung M52", "Samsung M53", "Samsung Note 4", "Samsung Note 9", "Samsung Note 10", "Samsung Note 10 Lite",
      "Samsung Note 10 Plus", "Samsung Note 20 5G", "Samsung Note 20 Plus", "Samsung Note 20 Ultra", "Samsung S9 Plus",
      "Samsung S10", "Samsung S10 Lite", "Samsung S20", "Samsung S20 FE", "Samsung S20 Plus", "Samsung S20 Ultra",
      "Samsung S21 / S30", "Samsung S21 FE", "Samsung S21 Plus", "Samsung S21 Ultra / S30 Ultra", "Samsung S22 Pro",
      "Samsung S22 Ultra", "Samsung S23", "Samsung S23 Ultra",
    ],
  },
  {
    brand: "Xiaomi & Redmi",
    aliases: "xiaomi redmi mi hm",
    models: [
      "Redmi 9", "Redmi 9T", "Redmi 10", "Redmi 10C", "Redmi 12", "Redmi Note 7 / 7 Pro", "Redmi Note 8", "Redmi Note 8 Pro",
      "Redmi Note 9", "Redmi Note 9S / 9 Pro", "Redmi Note 9S / 9 Pro Max / Note 10 Lite", "Redmi Note 10 5G",
      "Redmi Note 10 Pro", "Redmi Note 10 Pro 5G", "Redmi Note 10S", "Redmi Note 11 4G", "Redmi Note 11 5G",
      "Redmi Note 11 Pro 4G / 5G", "Redmi Note 11S 4G", "Redmi Note 11T 5G", "Redmi Note 13", "Xiaomi 11T", "Xiaomi 12T",
      "Xiaomi Mi 9T / 9T Pro", "Xiaomi Mi Note 10 Lite",
    ],
  },
  {
    brand: "Oppo",
    aliases: "oppo",
    models: [
      "Oppo A8", "Oppo A9 2020 / A5 2020 / A11 / A11x", "Oppo A52 / A72 / A92", "Oppo A54 4G / A55 5G", "Oppo A57",
      "Oppo A73 / F17", "Oppo A74", "Oppo A75", "Oppo A76 / A36 / Realme 9i", "Oppo A80",
      "Oppo A93 / Reno 4 Lite / F17 Pro / Reno 2F", "Oppo A94 / F19 Pro", "Oppo F7", "Oppo F11", "Oppo F11 Pro",
      "Oppo Reno 2", "Oppo Reno 2F / 2Z", "Oppo Reno 3", "Oppo Reno 4 4G", "Oppo Reno 4 Pro", "Oppo Reno 5 4G / 5G",
      "Oppo Reno 5 Pro", "Oppo Reno 6 4G", "Oppo Reno 6 5G", "Oppo Reno 8 4G", "Oppo Reno 8T 4G", "Oppo Reno 10 5G",
    ],
  },
  {
    brand: "Realme",
    aliases: "realme",
    models: ["Realme 7", "Realme 7 Pro", "Realme 8", "Realme 8 Pro", "Realme 10", "Realme 11", "Realme C12 / C15 / C25", "Realme C21", "Realme C53"],
  },
  {
    brand: "Huawei & Honor",
    aliases: "huawei honor",
    models: [
      "Honor 8X", "Honor 20 / Huawei Nova 5T", "Honor 20 Lite", "Honor 20 Pro", "Honor 50 Lite / X20 / Huawei Nova 8i",
      "Honor Play", "Huawei Mate 20 Pro", "Huawei Nova 2i / Mate 10 Lite / Honor 9i", "Huawei Nova 7",
    ],
  },
];

const byName = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

export const PHONE_MODEL_GROUPS = MODELS_BY_BRAND.map((g) => ({
  ...g,
  models: [...new Set(g.models)].sort(byName.compare),
}));

/** Every listed model, in display order. */
export const PHONE_MODELS: string[] = PHONE_MODEL_GROUPS.flatMap((g) => g.models);

/** A model the customer typed because theirs isn't listed: "Other: Nokia G21". */
export const OTHER_MODEL_PREFIX = "Other: ";
export const OTHER_MODEL = /^Other: [\p{L}\p{N} +/().,'-]{2,40}$/u;

/** Upload limits for product photos */
export const PRODUCT_IMAGE = {
  accept: ["image/png", "image/jpeg", "image/webp"] as const,
  maxFileMb: 15,
  /** Longest side after processing */
  maxPx: 2000,
  maxPerProduct: 8,
} as const;
