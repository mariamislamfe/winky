import "server-only";
import { STAGE_COLORS } from "@/config/catalog";
import { storage } from "./supabase";

/**
 * Small store-wide settings, kept as JSON files in the private "settings"
 * bucket (no database table needed).
 */
const STAGE_COLORS_FILE = "stage-colors.json";
const MAX_CUSTOM_COLORS = 24;

export const HEX_COLOR = /^#[0-9A-F]{6}$/;

/** Showcase colours added from the dashboard, oldest first. */
export async function readCustomStageColors(): Promise<string[]> {
  const { data, error } = await storage("settings").download(STAGE_COLORS_FILE);
  if (error || !data) return [];
  try {
    const list = JSON.parse(await data.text());
    return Array.isArray(list) ? list.filter((c): c is string => typeof c === "string" && HEX_COLOR.test(c)) : [];
  } catch {
    return [];
  }
}

async function writeCustomStageColors(list: string[]) {
  const { error } = await storage("settings").upload(STAGE_COLORS_FILE, JSON.stringify(list), {
    contentType: "application/json",
    cacheControl: "0",
    upsert: true,
  });
  if (error) throw new Error(`Couldn't save the colours: ${error.message}`);
}

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
