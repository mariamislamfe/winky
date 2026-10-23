import { Suspense } from "react";
import { AdminBar } from "@/components/admin/AdminBar";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/server/auth";

export const metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <>
      <AdminBar />
      <main id="main" className="mx-auto max-w-[900px] px-5 py-10">
        <h1 className="font-display text-5xl">Add product</h1>
        <div className="mt-8">
          <Suspense fallback={<p className="py-20 text-center opacity-60">Loading…</p>}>
            <Guarded />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function Guarded() {
  await requireAdmin();
  return <ProductForm />;
}
