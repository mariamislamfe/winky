import { PLAIN_BASES } from "@/config/customization";
import { PHONE_MODEL_SUGGESTIONS } from "@/config/catalog";
import { PRICING } from "@/config/pricing";
import type { CartLine, Category, Product } from "./types";

export const CATEGORY_LABEL: Record<Category, { one: string; many: string }> = {
  tote: { one: "Tote bag", many: "Tote bags" },
  case: { one: "Phone case", many: "Phone cases" },
};

/**
 * The two blank products customers design in the customizer. They're built
 * in (not managed in the dashboard) and priced from config/pricing.ts.
 */
export const CUSTOM_BASES: Record<Category, Product> = {
  tote: {
    id: "your-tote",
    slug: "your-tote",
    name: "Your Tote",
    category: "tote",
    tagline: "Your artwork, your words, exactly where you want them.",
    description: "Upload your own design, add text, and place everything on a plain tote.",
    price: PRICING.customBase.tote,
    images: [],
    stage: "#FFD1E4",
    stageInk: "#2B1140",
    models: [],
    isNew: false,
    published: true,
    createdAt: "",
    updatedAt: "",
    customOnly: true,
  },
  case: {
    id: "your-case",
    slug: "your-case",
    name: "Your Case",
    category: "case",
    tagline: "Your artwork, your words, exactly where you want them.",
    description: "Upload your own design, add text, and place everything on a plain case.",
    price: PRICING.customBase.case,
    images: [],
    stage: "#FFD1E4",
    stageInk: "#2B1140",
    models: [...PHONE_MODEL_SUGGESTIONS],
    isNew: false,
    published: true,
    createdAt: "",
    updatedAt: "",
    customOnly: true,
  },
};

export function findProduct(products: Product[], slug: string): Product | undefined {
  return products.find((p) => p.slug === slug) ?? Object.values(CUSTOM_BASES).find((p) => p.slug === slug);
}

/** Unit price of a cart line in minor units, or null if it can't be priced. */
export function linePrice(line: CartLine, products: Product[]): number | null {
  const product = findProduct(products, line.slug);
  if (!product) return null;
  const fee = line.custom ? PRICING.customizationFee : 0;
  if (fee == null) return null;
  return product.price + fee;
}

/** Colour of the plain product a custom design is printed on. */
export function colorForBase(baseId: string, category: Category) {
  return (PLAIN_BASES[category].find((b) => b.id === baseId) ?? PLAIN_BASES[category][0]).color;
}
