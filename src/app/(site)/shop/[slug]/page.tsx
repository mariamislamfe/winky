import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageBlink } from "@/components/layout/PageBlink";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { comingSoon } from "@/lib/catalog";
import { descriptionFor } from "@/lib/models";
import { getStoreProducts } from "@/lib/server/catalog-data";

// Cache Components needs at least one param at build time; an empty store
// gets a placeholder that 404s. Products added later render on first visit.
const EMPTY = "__no-products__";

export async function generateStaticParams() {
  const products = await getStoreProducts();
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: EMPTY }];
}

async function findBySlug(slug: string) {
  return (await getStoreProducts()).find((p) => p.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await findBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.tagline || descriptionFor(product).slice(0, 160),
    openGraph: product.images[0] ? { images: [product.images[0].src] } : undefined,
  };
}

/**
 * Params are resolved before rendering so an unknown slug returns a real 404
 * status. This only opts out of the dev-time instant-shell validation that
 * would otherwise require a Suspense fallback.
 */
export const instant = false;

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const products = await getStoreProducts();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  // Coming-soon products are a peek on the shop only, they don't have a page yet
  if (comingSoon(product.category)) redirect(`/shop?category=${product.category}`);

  const related = products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4);

  return (
    <>
      <PageBlink />
      <ProductDetail product={product} />
      {related.length > 0 && (
      <section aria-labelledby="related-title" className="bg-white/50 py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <h2 id="related-title" className="font-display text-[clamp(2.6rem,6vw,4.5rem)] leading-[0.9]">
            More winks
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} morph={false} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}
    </>
  );
}
