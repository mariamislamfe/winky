import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminBar } from "@/components/admin/AdminBar";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/server/auth";
import { adminListProducts } from "@/lib/server/products";

export const metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <>
      <AdminBar />
      <main id="main" className="mx-auto max-w-[900px] px-5 py-10">
        <Suspense fallback={<p className="py-20 text-center opacity-60">Loading…</p>}>
          <EditForm params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function EditForm({ params }: { params: PageProps<"/admin/products/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const product = (await adminListProducts()).find((p) => p.id === id);
  if (!product) notFound();
  return (
    <>
      <h1 className="font-display text-5xl">Edit {product.name}</h1>
      <div className="mt-8">
        <ProductForm product={product} />
      </div>
    </>
  );
}
