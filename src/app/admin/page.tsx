import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminBar } from "@/components/admin/AdminBar";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { WinkMark } from "@/components/brand/WinkMark";
import { CATEGORY_LABEL } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/server/auth";
import { adminListProducts } from "@/lib/server/products";
import { liveProducts } from "@/lib/store-products";

export const metadata = { title: "Products" };

export default function AdminHome({ searchParams }: PageProps<"/admin">) {
  return (
    <>
      <AdminBar />
      <main id="main" className="mx-auto max-w-[1100px] px-5 py-10">
        <Suspense fallback={<p className="py-20 text-center opacity-60">Loading products…</p>}>
          <ProductList searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function ProductList({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireAdmin();
  const [products, params] = await Promise.all([adminListProducts(), searchParams]);
  const saved = typeof params.saved === "string" ? params.saved : null;
  const live = liveProducts(products).length;

  return (
    <>
      {saved && (
        <p role="status" className="mb-6 rounded-2xl bg-mint px-5 py-3 font-semibold">
          Saved “{saved}”. The store is updated.
        </p>
      )}
      {live === 0 && (
        <p className="mb-6 rounded-2xl bg-butter px-5 py-3 font-medium">
          Your store is showing <strong>sample products</strong> for now. They disappear automatically as soon as you publish
          your first product.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Products</h1>
          <p className="mt-1 opacity-75">
            {products.length} {products.length === 1 ? "product" : "products"}, {live} live in the store. The order here is the
            order in the shop.
          </p>
        </div>
        <Link href="/admin/products/new" className="btn">
          Add product <span className="wink-eye" aria-hidden />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-[32px] bg-white px-6 py-16 text-center ring-2 ring-grape/10">
          <WinkMark className="w-20 text-gum" />
          <p className="font-display text-3xl">No products yet</p>
          <p className="max-w-[40ch] opacity-75">Add your first tote or phone case. It appears in the store as soon as you publish it.</p>
          <Link href="/admin/products/new" className="btn mt-2">
            Add your first product
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3">
          {products.map((p, i) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-[24px] bg-white p-3 pr-4 ring-2 ring-grape/10 sm:flex-nowrap">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl" style={{ background: p.stage }}>
                {p.images[0] ? (
                  <Image src={p.images[0].src} alt="" width={p.images[0].width} height={p.images[0].height} sizes="80px" className="max-h-[90%] w-auto object-contain" />
                ) : (
                  <span className="text-xs font-semibold">No photo</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">{p.name}</p>
                <p className="text-sm opacity-75">
                  {CATEGORY_LABEL[p.category].one}, {formatPrice(p.price)}
                  {p.category === "case" && `, ${p.models.length} ${p.models.length === 1 ? "model" : "models"}`}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.published ? "bg-mint" : "bg-grape/10"}`}>
                    {p.published ? "Live" : "Draft"}
                  </span>
                  {p.isNew && <span className="rounded-full bg-butter px-2.5 py-0.5 text-xs font-bold">New</span>}
                </div>
              </div>
              <ProductRowActions
                id={p.id}
                name={p.name}
                slug={p.slug}
                published={p.published}
                first={i === 0}
                last={i === products.length - 1}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
