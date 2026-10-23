import "server-only";
import { randomUUID } from "node:crypto";
import {
  CUSTOM_TEXT,
  MAX_LAYERS,
  PLAIN_BASES,
  TEXT_COLORS,
  TEXT_STYLES,
} from "@/config/customization";
import { GOVERNORATES, SHIPPING_FEE } from "@/config/orders";
import { depositFor, instapayReady } from "@/config/payments";
import { PRICING } from "@/config/pricing";
import { SITE } from "@/config/site";
import { findProduct } from "@/lib/catalog";
import { clamp, LIMITS } from "@/lib/layers";
import { storefrontProducts } from "@/lib/store-products";
import type { CartLine, Customization, DepositStatus, DesignLayer, Order, OrderCustomer, OrderLine, OrderStatus } from "@/lib/types";
import { designExists, receiptExists } from "./designs";
import { readProducts } from "./store";
import { db } from "./supabase";

/**
 * Orders live in the `orders` table: the order as JSON, plus a database
 * counter that hands out the WK-1001, WK-1002… numbers without clashes.
 */
type OrderRow = { id: string; number: number; data: Order };
const fromRow = (row: OrderRow): Order => ({ ...row.data, id: row.id, number: `WK-${row.number}` });

/** Newest first. */
export async function readOrders(): Promise<Order[]> {
  const { data, error } = await db().from("orders").select("id, number, data").order("number", { ascending: false });
  if (error) throw new Error(`Couldn't load orders: ${error.message}`);
  return (data as OrderRow[]).map(fromRow);
}

export async function readOrder(id: string): Promise<Order | null> {
  const { data, error } = await db().from("orders").select("id, number, data").eq("id", id).maybeSingle();
  if (error) throw new Error(`Couldn't load the order: ${error.message}`);
  return data ? fromRow(data as OrderRow) : null;
}

// ── Validation ───────────────────────────────────────────────────

export type CheckoutErrors = Partial<Record<keyof OrderCustomer | "form" | "payer" | "receipt", string>>;

export type DepositInput = { payer?: unknown; reference?: unknown; receiptFileId?: unknown };

/** Egyptian mobile numbers: 010/011/012/015 + 8 digits, with or without +20. */
export function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "").replace(/^\+?20/, "0").replace(/^(?!0)/, "0");
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}

function cleanCustomer(input: Partial<Record<keyof OrderCustomer, unknown>>) {
  const s = (v: unknown, max: number) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
  const customer: OrderCustomer = {
    name: s(input.name, 80),
    phone: s(input.phone, 20),
    email: s(input.email, 120),
    governorate: s(input.governorate, 40),
    city: s(input.city, 60),
    address: String(input.address ?? "").trim().slice(0, 300),
    notes: String(input.notes ?? "").trim().slice(0, 500),
  };
  const errors: CheckoutErrors = {};
  if (customer.name.length < 2) errors.name = "Enter your full name.";
  const phone = normalizePhone(customer.phone);
  if (!phone) errors.phone = "Enter an Egyptian mobile number, like 01012345678.";
  else customer.phone = phone;
  if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email)) errors.email = "Enter an email like name@example.com, or leave it empty.";
  if (!(GOVERNORATES as readonly string[]).includes(customer.governorate)) errors.governorate = "Choose your governorate.";
  if (customer.city.length < 2) errors.city = "Enter your city or area.";
  if (customer.address.length < 5) errors.address = "Enter your street address, building and apartment.";
  return { customer, errors };
}

const num = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? clamp(n, min, max) : fallback;
};

/** Re-check a customization and swap browser previews for the stored originals. */
async function cleanCustom(c: Customization, category: "tote" | "case"): Promise<Customization | string> {
  if (!PLAIN_BASES[category].some((b) => b.id === c?.baseId)) return "A custom item has an unknown product colour.";
  if (!Array.isArray(c.layers) || c.layers.length === 0) return "A custom item has no design.";
  if (c.layers.length > MAX_LAYERS) return "A custom item has too many layers.";
  const layers: DesignLayer[] = [];
  for (const l of c.layers) {
    const base = {
      id: String(l.id ?? randomUUID()).slice(0, 60),
      x: num(l.x, 0, 1, 0.5),
      y: num(l.y, 0, 1, 0.5),
      rotation: num(l.rotation, -180, 180, 0),
    };
    if (l.kind === "image") {
      if (!l.fileId || !(await designExists(l.fileId))) {
        return "One of your uploaded designs is missing. Remove it from your bag, upload it again in the customizer and reorder.";
      }
      layers.push({
        ...base,
        kind: "image",
        fileId: l.fileId,
        src: `/api/admin/designs/${l.fileId}`,
        name: String(l.name ?? "design").slice(0, 120),
        aspect: num(l.aspect, 0.05, 20, 1),
        originalWidth: Math.round(num(l.originalWidth, 1, 100000, 1)),
        originalHeight: Math.round(num(l.originalHeight, 1, 100000, 1)),
        width: num(l.width, ...LIMITS.imageWidth, 0.5),
      });
    } else if (l.kind === "text") {
      const text = String(l.text ?? "").slice(0, CUSTOM_TEXT.maxLength);
      if (!text.trim() || !CUSTOM_TEXT.allowedPattern.test(text)) return "A custom text uses characters we can't print.";
      if (!TEXT_STYLES.some((t) => t.id === l.style) || !TEXT_COLORS.some((t) => t.id === l.color)) return "A custom text has an unknown style.";
      layers.push({ ...base, kind: "text", text, style: l.style, color: l.color, size: num(l.size, ...LIMITS.textSize, 0.2) });
    } else {
      return "A custom item has an unknown layer.";
    }
  }
  return { baseId: c.baseId, layers };
}

// Basic guard against bots flooding the order list: 10 orders per device per hour.
async function allowOrder(key: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await db()
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("client_key", key)
    .gte("created_at", since);
  return error ? true : (count ?? 0) < 10;
}

export async function createOrder(
  input: { customer: Partial<Record<keyof OrderCustomer, unknown>>; lines: CartLine[]; deposit: DepositInput },
  clientKey: string,
): Promise<{ order: Order } | { errors: CheckoutErrors }> {
  if (!instapayReady()) return { errors: { form: "Ordering opens very soon. We're setting up InstaPay payments." } };
  const { customer, errors } = cleanCustomer(input.customer ?? {});
  const payer = String(input.deposit?.payer ?? "").trim().slice(0, 80);
  const reference = String(input.deposit?.reference ?? "").trim().slice(0, 80);
  const receiptFileId = String(input.deposit?.receiptFileId ?? "");
  if (payer.length < 2) errors.payer = "Enter the name or InstaPay number you paid from.";
  if (!(await receiptExists(receiptFileId))) errors.receipt = "Upload a screenshot of your InstaPay transfer.";
  if (Object.keys(errors).length) return { errors };
  if (!(await allowOrder(clientKey))) return { errors: { form: "Too many orders from this device. Try again in a while or contact us." } };

  const lines = Array.isArray(input.lines) ? input.lines.slice(0, 30) : [];
  if (!lines.length) return { errors: { form: "Your bag is empty." } };

  const products = storefrontProducts(await readProducts());
  const out: OrderLine[] = [];
  for (const l of lines) {
    const product = findProduct(products, String(l?.slug ?? ""));
    if (!product) return { errors: { form: "Something in your bag is no longer available. Remove it and try again." } };
    const quantity = Math.round(num(l.quantity, 1, SITE.maxQuantityPerLine, 1));
    let variant: string | undefined;
    if (product.category === "case" && product.models.length) {
      if (!l.variant || !product.models.includes(l.variant)) {
        return { errors: { form: `Choose a phone model for ${product.name} before ordering.` } };
      }
      variant = l.variant;
    }
    let custom: Customization | undefined;
    if (l.custom) {
      if (!product.customOnly) return { errors: { form: "Something in your bag can't be customized." } };
      const cleaned = await cleanCustom(l.custom, product.category);
      if (typeof cleaned === "string") return { errors: { form: cleaned } };
      custom = cleaned;
    } else if (product.customOnly) {
      return { errors: { form: "A custom item in your bag has no design." } };
    }
    const fee = custom ? (PRICING.customizationFee ?? 0) : 0;
    out.push({
      slug: product.slug,
      name: custom ? `Custom ${product.category === "tote" ? "tote" : "case"}` : product.name,
      category: product.category,
      quantity,
      unitPrice: product.price + fee,
      variant,
      image: product.images[0],
      custom,
    });
  }

  const subtotal = out.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
  const total = subtotal + (SHIPPING_FEE ?? 0);
  const now = new Date().toISOString();
  const draft: Order = {
    id: randomUUID(),
    // Set from the database counter when the order is saved
    number: "",
    createdAt: now,
    updatedAt: now,
    status: "new",
    paymentMethod: "instapay-deposit",
    deposit: { amount: depositFor(total), status: "pending", payer, reference, receiptFileId },
    codBalance: total - depositFor(total),
    customer,
    lines: out,
    subtotal,
    shipping: SHIPPING_FEE,
    total,
    currency: SITE.currency,
    zinkRef: "",
    adminNote: "",
  };
  const { data, error } = await db()
    .from("orders")
    .insert({ id: draft.id, client_key: clientKey, created_at: now, data: draft })
    .select("id, number, data")
    .single();
  if (error) return { errors: { form: "Your order couldn't be saved. Try again in a minute; nothing was charged twice." } };
  return { order: fromRow(data as OrderRow) };
}

export async function updateOrder(
  id: string,
  patch: { status?: OrderStatus; depositStatus?: DepositStatus; zinkRef?: string; adminNote?: string },
) {
  const current = await readOrder(id);
  if (!current) return null;
  const next: Order = {
    ...current,
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.depositStatus ? { deposit: { ...current.deposit, status: patch.depositStatus } } : {}),
    ...(patch.zinkRef !== undefined ? { zinkRef: patch.zinkRef.trim().slice(0, 80) } : {}),
    ...(patch.adminNote !== undefined ? { adminNote: patch.adminNote.trim().slice(0, 2000) } : {}),
    updatedAt: new Date().toISOString(),
  };
  const { error } = await db().from("orders").update({ data: next }).eq("id", id);
  if (error) throw new Error(`Couldn't save the order: ${error.message}`);
  return next;
}
