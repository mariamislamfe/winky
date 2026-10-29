import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { STAGE_COLORS } from "@/config/catalog";
import { EXPENSE_CATEGORIES } from "@/config/finance";
import { GOVERNORATES, type DeliveryFees } from "@/config/orders";
import type { FinanceEntry, NewFinanceEntry } from "@/lib/finance";
import { storage } from "./supabase";

/**
 * Small store-wide settings saved from the dashboard (custom showcase
 * colours, delivery fees, push notification keys and phones, finance entries), kept as JSON files in the private "settings"
 * bucket (no database table needed).
 */
const STAGE_COLORS_FILE = "stage-colors.json";
const DELIVERY_FEES_FILE = "delivery-fees.json";
const FINANCE_FILE = "finance.json";
const MAX_CUSTOM_COLORS = 24;

export const SETTINGS_TAG = "settings";
export const HEX_COLOR = /^#[0-9A-F]{6}$/;

async function readJson(file: string): Promise<unknown> {
  // A fresh nonce skips Supabase's CDN copy, which can lag behind a save by a few seconds
  // (long enough for a second save to start from the old list and undo the first)
  const { data, error } = await storage("settings").download(file, { cacheNonce: randomUUID() });
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text());
  } catch {
    return null;
  }
}

async function writeJson(file: string, value: unknown) {
  const { error } = await storage("settings").upload(file, JSON.stringify(value), {
    contentType: "application/json",
    cacheControl: "0",
    upsert: true,
  });
  if (error) throw new Error(`Couldn't save the settings: ${error.message}`);
}

// ── Showcase colours ─────────────────────────────────────────────

/** Showcase colours added from the dashboard, oldest first. */
export async function readCustomStageColors(): Promise<string[]> {
  const list = await readJson(STAGE_COLORS_FILE);
  return Array.isArray(list) ? list.filter((c): c is string => typeof c === "string" && HEX_COLOR.test(c)) : [];
}

const writeCustomStageColors = (list: string[]) => writeJson(STAGE_COLORS_FILE, list);

export async function addCustomStageColor(hex: string) {
  const list = await readCustomStageColors();
  if (list.includes(hex) || STAGE_COLORS.some((c) => c.hex === hex)) return list;
  const next = [...list, hex].slice(-MAX_CUSTOM_COLORS);
  await writeCustomStageColors(next);
  return next;
}

export async function removeCustomStageColor(hex: string) {
  const next = (await readCustomStageColors()).filter((c) => c !== hex);
  await writeCustomStageColors(next);
  return next;
}

// ── Delivery fees ────────────────────────────────────────────────

/** Delivery fee per governorate in piasters; a governorate without one is confirmed on the phone. */
export async function readDeliveryFees(): Promise<DeliveryFees> {
  const raw = await readJson(DELIVERY_FEES_FILE);
  const fees: DeliveryFees = {};
  if (raw && typeof raw === "object") {
    for (const g of GOVERNORATES) {
      const v = (raw as Record<string, unknown>)[g];
      if (typeof v === "number" && Number.isInteger(v) && v >= 0) fees[g] = v;
    }
  }
  return fees;
}

export const writeDeliveryFees = (fees: DeliveryFees) => writeJson(DELIVERY_FEES_FILE, fees);

/** Delivery fees for checkout, cached until they're saved again in the dashboard. */
export async function getDeliveryFees(): Promise<DeliveryFees> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("minutes");
  return readDeliveryFees();
}

// ── Order notifications (Web Push) ───────────────────────────────

const PUSH_KEYS_FILE = "push-keys.json";
const PUSH_SUBSCRIPTIONS_FILE = "push-subscriptions.json";

/** Signing keys for push messages, made once on first use. */
export async function getVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const raw = (await readJson(PUSH_KEYS_FILE)) as { publicKey?: unknown; privateKey?: unknown } | null;
  if (typeof raw?.publicKey === "string" && typeof raw.privateKey === "string") return { publicKey: raw.publicKey, privateKey: raw.privateKey };
  const { generateVAPIDKeys } = await import("web-push");
  const keys = generateVAPIDKeys();
  await writeJson(PUSH_KEYS_FILE, keys);
  return keys;
}

export type PushDevice = {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  /** e.g. "iPhone", shown in the dashboard */
  label: string;
  addedAt: string;
};

function validDevice(d: unknown): d is PushDevice {
  const s = (d as PushDevice | null)?.subscription;
  return (
    typeof s?.endpoint === "string" &&
    s.endpoint.startsWith("https://") &&
    typeof s.keys?.p256dh === "string" &&
    typeof s.keys?.auth === "string" &&
    typeof (d as PushDevice).label === "string"
  );
}

/** Phones that turned order notifications on. */
export async function readPushSubscriptions(): Promise<PushDevice[]> {
  const list = await readJson(PUSH_SUBSCRIPTIONS_FILE);
  return Array.isArray(list) ? list.filter(validDevice) : [];
}

export async function addPushSubscription(device: PushDevice) {
  const others = (await readPushSubscriptions()).filter((d) => d.subscription.endpoint !== device.subscription.endpoint);
  await writeJson(PUSH_SUBSCRIPTIONS_FILE, [...others, device].slice(-20));
}

export async function removePushSubscriptions(endpoints: string[]) {
  const list = await readPushSubscriptions();
  const next = list.filter((d) => !endpoints.includes(d.subscription.endpoint));
  if (next.length !== list.length) await writeJson(PUSH_SUBSCRIPTIONS_FILE, next);
}

// ── Finance ──────────────────────────────────────────────────────

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const money = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0;
const count = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 10000;

function validEntry(e: unknown): e is FinanceEntry {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  if (typeof x.id !== "string" || typeof x.date !== "string" || !DAY.test(x.date) || typeof x.note !== "string") return false;
  if (x.kind === "expense") return money(x.amount) && EXPENSE_CATEGORIES.some((c) => c.id === x.category);
  if (x.kind === "sale") return count(x.cases) && count(x.customCases) && money(x.extra);
  return false;
}

/** Expenses and outside orders added on the finance page, oldest first. */
export async function readFinanceEntries(): Promise<FinanceEntry[]> {
  const list = await readJson(FINANCE_FILE);
  return Array.isArray(list) ? list.filter(validEntry) : [];
}

export async function addFinanceEntry(entry: NewFinanceEntry) {
  const next = [...(await readFinanceEntries()), { ...entry, id: randomBytes(8).toString("hex") } as FinanceEntry];
  await writeJson(FINANCE_FILE, next);
}

export async function removeFinanceEntry(id: string) {
  await writeJson(FINANCE_FILE, (await readFinanceEntries()).filter((e) => e.id !== id));
}
