import { MetaPixel } from "@/components/analytics/MetaPixel";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CatalogProvider } from "@/components/catalog/CatalogProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE } from "@/config/site";
import { CartProvider } from "@/lib/cart";
import { getStoreProducts } from "@/lib/server/catalog-data";

/** Storefront shell. Products come from the dashboard (cached, refreshed on every save). */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const products = await getStoreProducts();
  return (
    <CatalogProvider products={products}>
      <CartProvider>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <CartDrawer />
        <MetaPixel />
        {SITE.metaPixelId && (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element -- Meta's tracking pixel for visitors without JavaScript */}
            <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${SITE.metaPixelId}&ev=PageView&noscript=1`} />
          </noscript>
        )}
      </CartProvider>
    </CatalogProvider>
  );
}
