import { CASE_DESCRIPTION, OTHER_MODEL, OTHER_MODEL_PREFIX, PHONE_MODEL_GROUPS, PHONE_MODELS } from "@/config/catalog";
import type { Product } from "./types";

/** Models a case is offered in: its own list, or every listed model when it has none. */
export const modelsFor = (product: Product) => (product.models.length ? product.models : PHONE_MODELS);

/** A model this case can be ordered in: one it's offered in, or one the customer typed ("Other: …"). */
export const isOrderableModel = (product: Product, model: string) =>
  modelsFor(product).includes(model) || OTHER_MODEL.test(model);

/** How a chosen model reads to the customer ("Other: Nokia G21" → "Nokia G21"). */
export const modelLabel = (model: string) =>
  model.startsWith(OTHER_MODEL_PREFIX) ? model.slice(OTHER_MODEL_PREFIX.length) : model;

/** The product's own description, or the standard one for phone cases. */
export const descriptionFor = (product: Product) =>
  product.description || (product.category === "case" ? CASE_DESCRIPTION : "");

const compact = (s: string) =>
  s.toLowerCase().replace(/\+/g, "plus").replace(/[^\p{L}\p{N}]+/gu, "");

// Search text per model: its name plus its brand's other names ("galaxy", "xiaomi"…)
const searchKey = new Map(
  PHONE_MODEL_GROUPS.flatMap((g) => g.models.map((m) => [m, compact(`${g.aliases} ${m}`)] as const)),
);

/**
 * Models matching what the customer typed. Every word has to appear, spaces
 * don't matter ("16 pro", "a54", "note10", "s23+"), and models containing
 * the whole query come first.
 */
export function searchModels(models: readonly string[], query: string) {
  const words = query.toLowerCase().replace(/\+/g, " plus ").split(/\s+/).map(compact).filter(Boolean);
  if (!words.length) return [...models];
  const whole = words.join("");
  const hits = models.filter((m) => {
    const key = searchKey.get(m) ?? compact(m);
    return words.every((w) => key.includes(w));
  });
  return [...hits.filter((m) => compact(m).includes(whole)), ...hits.filter((m) => !compact(m).includes(whole))];
}
