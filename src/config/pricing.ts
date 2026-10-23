import type { Category } from "@/lib/types";

/**
 * Pricing for custom (customer-designed) items.
 * Catalog products get their price from the dashboard.
 *
 * Amounts are in minor units (piasters): 45000 = EGP 450.
 */
export const PRICING = {
  /** Price of the plain tote / case a custom design is printed on */
  customBase: {
    tote: 45000,
    case: 35000,
  } satisfies Record<Category, number>,
  /** Added once per customized item. `null` = not priced yet. */
  customizationFee: 10000 as number | null,
} as const;
