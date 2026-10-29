import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { PageBlink } from "@/components/layout/PageBlink";
import { getDeliveryFees } from "@/lib/server/settings";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const deliveryFees = await getDeliveryFees();
  return (
    <>
      <PageBlink />
      <div className="mx-auto max-w-[1200px] px-5 pt-[calc(var(--header-h)+2.5rem)] pb-20 md:px-10 md:pt-[calc(var(--header-h)+3.5rem)]">
        <h1 className="font-display text-[clamp(3.2rem,9vw,7rem)] leading-[0.85] text-cobalt">Checkout</h1>
        <div className="mt-8 md:mt-12">
          <CheckoutView deliveryFees={deliveryFees} />
        </div>
      </div>
    </>
  );
}
