import type { MetadataRoute } from "next";
import { getStoreProducts } from "@/lib/server/catalog-data";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

/** Home, shop, customizer and every live product page. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getStoreProducts();
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/customize`, changeFrequency: "monthly", priority: 0.7 },
    ...products.map((p) => ({
      url: `${SITE_URL}/shop/${p.slug}`,
      lastModified: p.updatedAt || undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.images[0] ? [`${SITE_URL}${p.images[0].src}`] : undefined,
    })),
  ];
}
