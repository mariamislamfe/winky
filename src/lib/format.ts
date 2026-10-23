import { SITE } from "@/config/site";

const fmt = new Intl.NumberFormat(SITE.locale, {
  style: "currency",
  currency: SITE.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(minor: number | null | undefined) {
  if (minor == null) return "Price TBA";
  return fmt.format(minor / 100);
}

/** Order timestamps, shown in Egypt time. */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });
