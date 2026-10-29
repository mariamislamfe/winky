/**
 * Store-wide settings.
 */
export const SITE = {
  name: "WINKY",
  tagline: "Phone cases and tote bags that wink back.",
  /** ISO 4217 currency code */
  currency: "EGP",
  locale: "en-US",
  maxQuantityPerLine: 10,
  /**
   * Tote bags are shown but can't be ordered yet: they're labelled "Coming
   * soon" everywhere (home, shop, product pages, customizer) and the server
   * refuses them. Set to false to start selling totes.
   */
  totesComingSoon: true,
} as const;

/** Primary navigation, shared by header, mobile menu and footer. */
export const NAV_LINKS = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?category=tote", label: "Tote bags" },
  { href: "/shop?category=case", label: "Phone cases" },
  { href: "/customize", label: "Customize" },
] as const;
