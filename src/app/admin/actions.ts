"use server";

import { updateTag } from "next/cache";
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
import { addCustomStageColor, HEX_COLOR, removeCustomStageColor } from "@/lib/server/settings";

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
