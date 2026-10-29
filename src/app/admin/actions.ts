"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, adminConfigured, createSession, destroySession, requireAdmin } from "@/lib/server/auth";
import { PRODUCTS_TAG } from "@/lib/server/catalog-data";
import {
  createProduct,
  moveProduct,
  parseProductForm,
  removeProduct,
  setPublished,
  updateProduct,
  type FieldErrors,
} from "@/lib/server/products";
import { GOVERNORATES, type DeliveryFees } from "@/config/orders";
import { requestOrigin, sendPush } from "@/lib/server/notify";
import {
  addCustomStageColor,
  addPushSubscription,
  HEX_COLOR,
  removeCustomStageColor,
  removePushSubscriptions,
  SETTINGS_TAG,
  writeDeliveryFees,
  type PushDevice,
} from "@/lib/server/settings";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!adminConfigured()) {
    return { error: "The dashboard password isn't set on the server yet. Add ADMIN_PASSWORD to .env.local and restart." };
  }
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    // Slow down guessing
    await new Promise((r) => setTimeout(r, 800));
    return { error: "That password isn't right. Try again." };
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export type SaveState = { errors?: FieldErrors };

export async function saveProduct(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();
  const { errors, value } = parseProductForm(form);
  if (Object.keys(errors).length) return { errors };

  const id = String(form.get("id") ?? "");
  if (id) {
    const updated = await updateProduct(id, value);
    if (!updated) return { errors: { form: "This product no longer exists. It may have been deleted." } };
  } else {
    await createProduct(value);
  }
  updateTag(PRODUCTS_TAG);
  redirect(`/admin?saved=${encodeURIComponent(value.name)}`);
}

export type DeliveryState = { saved?: boolean; error?: string };

/** Delivery fee per governorate, in EGP; an empty box = confirmed on the phone. */
export async function saveDeliveryFees(_prev: DeliveryState, form: FormData): Promise<DeliveryState> {
  await requireAdmin();
  const fees: DeliveryFees = {};
  for (const g of GOVERNORATES) {
    const raw = String(form.get(g) ?? "").replace(",", ".").trim();
    if (!raw) continue;
    const egp = Number(raw);
    if (!Number.isFinite(egp) || egp < 0 || egp > 10000) return { error: `Check the fee for ${g}: enter a number like 60, or leave it empty.` };
    fees[g] = Math.round(egp * 100);
  }
  await writeDeliveryFees(fees);
  updateTag(SETTINGS_TAG);
  return { saved: true };
}

// ── Order notifications ──────────────────────────────────────────

/** Turns notifications on for this phone (its push subscription from the browser). */
export async function savePushSubscription(subscription: unknown, label: string) {
  await requireAdmin();
  const s = subscription as PushDevice["subscription"] | null;
  if (typeof s?.endpoint !== "string" || !s.endpoint.startsWith("https://") || typeof s.keys?.p256dh !== "string" || typeof s.keys?.auth !== "string") {
    throw new Error("Not a push subscription");
  }
  await addPushSubscription({
    subscription: { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } },
    label: String(label).slice(0, 40) || "Phone",
    addedAt: new Date().toISOString(),
  });
  refresh();
}

export async function deletePushSubscription(endpoint: string) {
  await requireAdmin();
  await removePushSubscriptions([String(endpoint)]);
  refresh();
}

/** Sends a test notification to every phone; returns how many got it. */
export async function sendTestPush() {
  await requireAdmin();
  return sendPush(
    { title: "WINKY notifications are on", body: "New orders will show up here. Tap one to open it.", url: "/admin/orders", tag: "test" },
    await requestOrigin(),
  );
}

/** Saves a showcase colour picked in the dashboard so every product can use it. */
export async function addStageColor(hex: string) {
  await requireAdmin();
  const color = String(hex).toUpperCase();
  if (!HEX_COLOR.test(color)) return null;
  return addCustomStageColor(color);
}

export async function removeStageColor(hex: string) {
  await requireAdmin();
  return removeCustomStageColor(String(hex).toUpperCase());
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await removeProduct(id);
  updateTag(PRODUCTS_TAG);
}

export async function togglePublished(id: string, published: boolean) {
  await requireAdmin();
  await setPublished(id, published);
  updateTag(PRODUCTS_TAG);
}

export async function reorderProduct(id: string, dir: -1 | 1) {
  await requireAdmin();
  await moveProduct(id, dir);
  updateTag(PRODUCTS_TAG);
}
