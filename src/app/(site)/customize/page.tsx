import type { Metadata } from "next";
import { Suspense } from "react";
import { Customizer } from "@/components/customize/Customizer";
import { WinkMark } from "@/components/brand/WinkMark";
import { PageBlink } from "@/components/layout/PageBlink";

export const metadata: Metadata = {
  title: "Customize yours",
  description: "Upload your own design, add text and place it exactly where you want on a WINKY tote bag or phone case.",
};

export default function CustomizePage() {
  return (
    <>
      <PageBlink />
      <header className="mx-auto max-w-[1400px] px-5 pt-[calc(var(--header-h)+2.5rem)] pb-6 md:px-10 md:pt-[calc(var(--header-h)+3.5rem)] md:pb-10">
        <h1 className="font-display flex flex-wrap items-end gap-x-5 text-[clamp(3.4rem,10vw,8.5rem)] leading-[0.85] text-gum">
          Make it yours
          <WinkMark className="mb-[0.12em] w-[0.9em] text-cobalt" />
        </h1>
        <p className="mt-6 max-w-[46ch] text-lg">
          Upload your own design, add text, then drag everything exactly where you want it. Your exact placement is saved with your design.
        </p>
      </header>
      <Suspense
        fallback={
          <div className="mx-auto grid h-[60vh] max-w-[1400px] place-items-center px-5" role="status">
            <WinkMark className="w-16 animate-pulse text-gum" title="Loading the customizer" />
          </div>
        }
      >
        <Customizer />
      </Suspense>
    </>
  );
}
