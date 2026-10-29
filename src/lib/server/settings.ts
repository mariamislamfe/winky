import "server-only";
import { randomBytes } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { STAGE_COLORS } from "@/config/catalog";
import { GOVERNORATES, type DeliveryFees } from "@/config/orders";
import { storage } from "./supabase";

/**
 * Small store-wide settings saved from the dashboard (custom showcase
 * colours, delivery fees, the order notification channel), kept as JSON files in the private "settings"
 * bucket (no database table needed).
 */
const STAGE_COLORS_FILE = "stage-colors.json";
const DELIVERY_FEES_FILE = "delivery-fees.json";
const NOTIFY_FILE = "notify.json";
const MAX_CUSTOM_COLORS = 24;

export const SETTINGS_TAG = "settings";
export const HEX_COLOR = /^#[0-9A-F]{6}$/;

async function readJson(file: string): Promise<unknown> {
  const { data, error } = await storage("settings").download(file);
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

// ── Order notifications ──────────────────────────────────────────

const NOTIFY_TOPIC = /^winky-[A-Za-z0-9_-]{16,40}$/;

/** The private ntfy channel new orders are sent to, or null before it's set up. */
export async function readNotifyTopic(): Promise<string | null> {
  const raw = await readJson(NOTIFY_FILE);
  const topic = raw && typeof raw === "object" ? (raw as { topic?: unknown }).topic : null;
  return typeof topic === "string" && NOTIFY_TOPIC.test(topic) ? topic : null;
}

/**
 * The channel name works like a password (anyone who knows it can read the
 * notifications), so it's long and random, made once on first use.
 */
export async function ensureNotifyTopic(): Promise<string> {
  const existing = await readNotifyTopic();
  if (existing) return existing;
  const topic = `winky-${randomBytes(15).toString("base64url")}`;
  await writeJson(NOTIFY_FILE, { topic });
  return topic;
}
