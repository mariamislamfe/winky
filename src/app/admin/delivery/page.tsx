import { Suspense } from "react";
import { AdminBar } from "@/components/admin/AdminBar";
import { DeliveryFeesForm } from "@/components/admin/DeliveryFeesForm";
import { requireAdmin } from "@/lib/server/auth";
import { readDeliveryFees } from "@/lib/server/settings";

export const metadata = { title: "Delivery fees" };

export default function DeliveryPage() {
  return (
    <>
      <AdminBar />
      <main id="main" className="mx-auto max-w-[900px] px-5 py-10">
        <h1 className="font-display text-5xl">Delivery fees</h1>
        <p className="mt-2 max-w-[60ch] opacity-75">
          The fee for each governorate is added to the order total at checkout. Leave a box empty to confirm that
          governorate&apos;s fee on the phone instead.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="py-20 text-center opacity-60">Loading…</p>}>
            <Fees />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function Fees() {
  await requireAdmin();
  return <DeliveryFeesForm fees={await readDeliveryFees()} />;
}
