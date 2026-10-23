import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { DESIGN_UPLOAD } from "@/config/orders";
import { DATA_DIR } from "./store-fs";

/**
 * Customers' original artwork for custom orders, kept full quality for
 * printing (PNG, transparency preserved). Only the dashboard can read them.
 */
export const DESIGNS_DIR = path.join(DATA_DIR, "designs");
const SAFE = /^[a-f0-9-]{36}\.png$/;

export async function saveDesign(input: Buffer) {
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: DESIGN_UPLOAD.maxPx, height: DESIGN_UPLOAD.maxPx, fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true });
  const fileId = `${randomUUID()}.png`;
  await fs.mkdir(DESIGNS_DIR, { recursive: true });
  await fs.writeFile(path.join(DESIGNS_DIR, fileId), data);
  return { fileId, width: info.width, height: info.height };
}

export async function designExists(fileId: string) {
  if (!SAFE.test(fileId)) return false;
  try {
    await fs.access(path.join(DESIGNS_DIR, fileId));
    return true;
  } catch {
    return false;
  }
}

export async function readDesign(fileId: string) {
  if (!SAFE.test(fileId)) return null;
  try {
    return await fs.readFile(path.join(DESIGNS_DIR, fileId));
  } catch {
    return null;
  }
}

// Very small in-memory rate limiter for the public upload endpoint.
const hits = new Map<string, number[]>();
export function allowUpload(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= DESIGN_UPLOAD.perTenMinutes) return false;
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}

// ── InstaPay transfer screenshots ────────────────────────────────

export const RECEIPTS_DIR = path.join(DATA_DIR, "receipts");
const SAFE_RECEIPT = /^[a-f0-9-]{36}\.jpg$/;

export async function saveReceipt(input: Buffer) {
  const data = await sharp(input)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 85 })
    .toBuffer();
  const fileId = `${randomUUID()}.jpg`;
  await fs.mkdir(RECEIPTS_DIR, { recursive: true });
  await fs.writeFile(path.join(RECEIPTS_DIR, fileId), data);
  return { fileId };
}

export async function receiptExists(fileId: string) {
  if (!SAFE_RECEIPT.test(fileId)) return false;
  try {
    await fs.access(path.join(RECEIPTS_DIR, fileId));
    return true;
  } catch {
    return false;
  }
}

export async function readReceipt(fileId: string) {
  if (!SAFE_RECEIPT.test(fileId)) return null;
  try {
    return await fs.readFile(path.join(RECEIPTS_DIR, fileId));
  } catch {
    return null;
  }
}
