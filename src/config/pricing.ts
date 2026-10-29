import type { Category } from "@/lib/types";

/**
 * Prices in minor units (piasters): 12000 = EGP 120.
 *
 * Phone cases all cost the same: CASE_PRICE applies to every case, old and
 * new, whatever price is saved on the product in the dashboard. Tote bags
 * get their price from the dashboard.
 */
export const CASE_PRICE = 12000;

export const PRICING = {
  /** Price of the plain tote / case a custom design is printed on */
  customBase: {
    tote: 45000,
    case: CASE_PRICE,
  } satisfies Record<Category, number>,
  /** Added once per customized item: a custom case is 120 + 30 = EGP 150 */
  customizationFee: {
    tote: 10000,
    case: 3000,
  } satisfies Record<Category, number>,
} as const;

/**
 * "Was" prices shown crossed out next to the real price, so the offer shows:
 * cases EGP 200 → 120, custom cases EGP 250 → 150. Display only, never charged.
 */
export const COMPARE_AT = { case: 20000, customCase: 25000 } as const;

/**
 * What WINKY keeps from each piece sold (minor units), used by the finance
 * page: EGP 38 per case, EGP 68 per custom case. Totes aren't on sale yet:
 * set theirs when they launch.
 */
export const PROFIT_PER_ITEM = {
  case: { regular: 3800, custom: 6800 },
  tote: { regular: 0, custom: 0 },
} as const satisfies Record<Category, { regular: number; custom: number }>;
