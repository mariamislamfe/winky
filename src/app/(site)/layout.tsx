import { CartDrawer } from "@/components/cart/CartDrawer";
import { CatalogProvider } from "@/components/catalog/CatalogProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
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
      </CartProvider>
    </CatalogProvider>
  );
}
