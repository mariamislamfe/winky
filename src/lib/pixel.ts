import { SITE } from "@/config/site";
import type { CartLine, Product } from "./types";

/**
 * Meta (Facebook/Instagram) Pixel, storefront only. Loads Meta's standard
 * snippet on first use; every call is a no-op on the server or without an id.
 */
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const enabled = () => typeof window !== "undefined" && !!SITE.metaPixelId;

/** Meta's base code: a queueing stub, then fbevents.js loads in the background. */
export function loadPixel() {
  if (!enabled() || window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq ??= fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", SITE.metaPixelId);
}

/** A standard event, e.g. "AddToCart". `eventId` lets Meta drop duplicates of the same purchase. */
export function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (!enabled()) return;
  loadPixel();
  if (eventId) window.fbq!("track", event, params ?? {}, { eventID: eventId });
  else if (params) window.fbq!("track", event, params);
  else window.fbq!("track", event);
}

/** Money for Meta: EGP, not piasters. */
export const pixelValue = (minor: number) => ({ value: Math.round(minor) / 100, currency: SITE.currency });

export const productParams = (product: Product) => ({
  content_ids: [product.slug],
  content_name: product.name,
  content_category: product.category,
  content_type: "product",
  ...pixelValue(product.price),
});

export const linesParams = (lines: CartLine[], value: number) => ({
  content_ids: [...new Set(lines.map((l) => l.slug))],
  contents: lines.map((l) => ({ id: l.slug, quantity: l.quantity })),
  content_type: "product",
  num_items: lines.reduce((n, l) => n + l.quantity, 0),
  ...pixelValue(value),
});
