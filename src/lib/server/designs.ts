import "server-only";
import { randomUUID } from "node:crypto";
import { PRODUCT_IMAGE } from "@/config/catalog";
import { DESIGN_UPLOAD } from "@/config/orders";
import { storage } from "./supabase";

/**
 * Files customers and the dashboard upload. The browser sends them straight
 * to Supabase Storage with a one-time signed link from /api/uploads, so big
 * files never pass through (or get cut off by) our server.
 *
 * - design: customers' original artwork, kept exactly as uploaded for printing
 * - receipt: InstaPay transfer screenshots
 * - product: dashboard photos, processed into WebP by /api/admin/upload
 */
export const UPLOAD_KINDS = {
  design: { bucket: "designs", folder: "", maxMb: DESIGN_UPLOAD.maxFileMb, admin: false },
  receipt: { bucket: "receipts", folder: "", maxMb: 10, admin: false },
  product: { bucket: "products", folder: "incoming/", maxMb: PRODUCT_IMAGE.maxFileMb, admin: true },
} as const;
export type UploadKind = keyof typeof UPLOAD_KINDS;

export const UPLOAD_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Only our own generated names are ever read. */
export const FILE_ID = /^[a-f0-9-]{36}\.(png|jpg|webp)$/;

export const contentTypeOf = (fileId: string) =>
  Object.keys(UPLOAD_TYPES).find((t) => fileId.endsWith(`.${UPLOAD_TYPES[t]}`)) ?? "application/octet-stream";

/** A one-time link the browser can PUT the file to. */
export async function signedUpload(kind: UploadKind, type: string) {
  const fileId = `${randomUUID()}.${UPLOAD_TYPES[type]}`;
  const { bucket, folder } = UPLOAD_KINDS[kind];
  const { data, error } = await storage(bucket).createSignedUploadUrl(folder + fileId);
  if (error) throw new Error(error.message);
  return { fileId, url: data.signedUrl };
}

async function exists(bucket: "designs" | "receipts", fileId: string) {
  if (!FILE_ID.test(fileId)) return false;
  const { data } = await storage(bucket).exists(fileId);
  return Boolean(data);
}

async function read(bucket: "designs" | "receipts" | "products", path: string) {
  const { data, error } = await storage(bucket).download(path);
  return error || !data ? null : Buffer.from(await data.arrayBuffer());
}

export const designExists = (fileId: string) => exists("designs", fileId);
export const receiptExists = (fileId: string) => exists("receipts", fileId);
export const readDesign = (fileId: string) => (FILE_ID.test(fileId) ? read("designs", fileId) : null);
export const readReceipt = (fileId: string) => (FILE_ID.test(fileId) ? read("receipts", fileId) : null);

/** A dashboard photo the browser just uploaded, read once and then removed. */
export async function takeIncomingPhoto(fileId: string) {
  if (!FILE_ID.test(fileId)) return null;
  const path = UPLOAD_KINDS.product.folder + fileId;
  const data = await read("products", path);
  await storage("products").remove([path]);
  return data;
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
