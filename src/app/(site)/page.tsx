import { CaseFan } from "@/components/home/CaseFan";
import { CustomizeTeaser } from "@/components/home/CustomizeTeaser";
import { FinalCta } from "@/components/home/FinalCta";
import { FreshDrops } from "@/components/home/FreshDrops";
import { Hero } from "@/components/home/Hero";
import { ToteCarousel } from "@/components/home/ToteCarousel";
import { PageBlink } from "@/components/layout/PageBlink";

/**
 * The home journey:
 * gum hero → (the eye swallows the screen) → blue-raspberry tote rail
 * → colour-shifting case hand → milk customizer → mint sticker sheet
 * → gum wink goodbye.
 */
export default function Home() {
  return (
    <>
      <PageBlink />
      <Hero />
      <ToteCarousel />
      <CaseFan />
      <CustomizeTeaser />
      <FreshDrops />
      <FinalCta />
    </>
  );
}
