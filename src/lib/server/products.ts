import "server-only";
import { randomUUID } from "node:crypto";
import { DEFAULT_STAGE, PRODUCT_IMAGE, STAGE_COLORS } from "@/config/catalog";
import { luminance } from "@/lib/color";
import type { Category, Product, ProductImage } from "@/lib/types";
import { deleteUploads, mutateProducts, readProducts } from "./store-fs";

export type FieldErrors = Partial<Record<"name" | "price" | "category" | "images" | "models" | "description" | "form", string>>;

const MEDIA_SRC = /^\/media\/[a-f0-9-]{36}\.webp$/;

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseImages(raw: string): ProductImage[] | null {
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return null;
    const out: ProductImage[] = [];
    for (const i of list) {
      if (!i || typeof i.src !== "string" || !MEDIA_SRC.test(i.src)) return null;
      const width = Math.round(Number(i.width));
      const height = Math.round(Number(i.height));
      if (!(width > 0 && height > 0)) return null;
      out.push({ src: i.src, width, height, cutout: Boolean(i.cutout), alt: String(i.alt ?? "").slice(0, 140) });
    }
    return out;
  } catch {
    return null;
  }
}

/** Validate and normalize a dashboard form submission. */
export function parseProductForm(form: FormData) {
  const errors: FieldErrors = {};
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const category = String(form.get("category") ?? "") as Category;
  const priceRaw = String(form.get("price") ?? "").replace(",", ".").trim();
  const tagline = String(form.get("tagline") ?? "").trim().slice(0, 120);
  const description = String(form.get("description") ?? "").trim().slice(0, 2000);
  const stageRaw = String(form.get("stage") ?? "");
  const images = parseImages(String(form.get("images") ?? "[]"));
  const models = [...new Set(form.getAll("models").map((m) => String(m).trim().slice(0, 40)).filter(Boolean))].slice(0, 40);

  if (!name) errors.name = "Give the product a name.";
  if (category !== "tote" && category !== "case") errors.category = "Choose tote bag or phone case.";
  const price = Number(priceRaw);
  if (!priceRaw || !Number.isFinite(price) || price <= 0) errors.price = "Enter a price above 0, like 450 or 450.50.";
  if (!images) errors.images = "Something went wrong with the photos. Remove them and upload again.";
  else if (images.length === 0) errors.images = "Add at least one photo.";
  else if (images.length > PRODUCT_IMAGE.maxPerProduct) errors.images = `Use up to ${PRODUCT_IMAGE.maxPerProduct} photos.`;
  if (category === "case" && models.length === 0) errors.models = "Pick at least one phone model this case fits.";

  const stage = STAGE_COLORS.some((c) => c.hex === stageRaw)
    ? stageRaw
    : DEFAULT_STAGE[category === "case" ? "case" : "tote"];

  return {
    errors,
    value: {
      name,
      category,
      price: Math.round(price * 100),
      tagline,
      description,
      stage,
      stageInk: luminance(stage) > 0.3 ? "#2B1140" : "#FFF0F5",
      images: (images ?? []).map((img) => ({ ...img, alt: img.alt || name })),
      models: category === "case" ? models : [],
      isNew: form.get("isNew") === "on",
      published: form.get("published") === "on",
    },
  };
}

type ProductValues = ReturnType<typeof parseProductForm>["value"];

function uniqueSlug(base: string, list: Product[], selfId?: string) {
  const root = base || "product";
  let slug = root;
  for (let n = 2; list.some((p) => p.slug === slug && p.id !== selfId); n++) slug = `${root}-${n}`;
  return slug;
}

export async function createProduct(values: ProductValues) {
  return mutateProducts((list) => {
    const now = new Date().toISOString();
    const product: Product = {
      ...values,
      id: randomUUID(),
      slug: uniqueSlug(slugify(values.name), list),
      createdAt: now,
      updatedAt: now,
    };
    // Newest first: it shows up first in the shop's "Featured" order
    return { list: [product, ...list], result: product };
  });
}

export async function updateProduct(id: string, values: ProductValues) {
  const removed: string[] = [];
  const result = await mutateProducts((list) => {
    const current = list.find((p) => p.id === id);
    if (!current) return { list, result: null };
    const next: Product = {
      ...current,
      ...values,
      // Keep the URL stable unless the name actually changed
      slug: values.name === current.name ? current.slug : uniqueSlug(slugify(values.name), list, id),
      updatedAt: new Date().toISOString(),
    };
    removed.push(...current.images.map((i) => i.src).filter((src) => !next.images.some((i) => i.src === src)));
    return { list: list.map((p) => (p.id === id ? next : p)), result: next };
  });
  await deleteUploads(removed);
  return result;
}

export async function removeProduct(id: string) {
  const gone = await mutateProducts((list) => {
    const product = list.find((p) => p.id === id);
    return { list: list.filter((p) => p.id !== id), result: product };
  });
  if (gone) await deleteUploads(gone.images.map((i) => i.src));
}

export async function setPublished(id: string, published: boolean) {
  await mutateProducts((list) => ({
    list: list.map((p) => (p.id === id ? { ...p, published, updatedAt: new Date().toISOString() } : p)),
    result: null,
  }));
}

export async function moveProduct(id: string, dir: -1 | 1) {
  await mutateProducts((list) => {
    const i = list.findIndex((p) => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return { list, result: null };
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return { list: next, result: null };
  });
}

export const adminListProducts = readProducts;
