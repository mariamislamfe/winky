# WINKY

Storefront for WINKY: phone cases and tote bags that wink back.

Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, GSAP + ScrollTrigger for scroll scenes, Motion for component springs and gestures.

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build && npm start
```

## Product dashboard (`/admin`)

Add, edit, publish/unpublish, reorder and delete your products. Each product has photos, a name, a price, a short line, a description, a showcase color, a "New" flag and, for cases, the phone models it fits. Saving updates the store immediately.

- **Login:** one password, set as `ADMIN_PASSWORD` in `.env.local` locally (already created, change it) and in your host's environment in production. Sessions last 7 days; changing the password signs everyone out.
- **Photos:** PNG, JPG or WebP up to 15 MB. They're auto-rotated, resized to 2000 px and converted to WebP. **Transparent PNG cut-outs** float freely on the homepage. Regular photos get a white rounded frame.
- **Where data lives:** `data/products.json` and `data/uploads/` (or the folder in `WINKY_DATA_DIR`). This needs a server with a persistent disk: your own computer, a VPS, or Docker with a volume. **Back this folder up.** It's git-ignored. On serverless hosts like Vercel the disk is temporary, so swap `src/lib/server/store-fs.ts` for a database and object storage. Nothing else needs to change.
- **Sample products:** until you publish your first real product, the store shows 14 illustrated sample designs (`src/data/samples.ts`, prices are placeholders). As soon as one real product is live, every sample disappears automatically. If you unpublish everything, they come back.

## Orders (`/admin/orders`)

Checkout is **cash on delivery**: Zink prints, delivers and collects the cash. Each order is saved to `data/orders.json` and shows up in the dashboard right away with:

- Customer name, mobile (normalized to 01xxxxxxxxx), governorate, city, address and notes, with copy buttons for entering them on Zink.
- Every item with its phone model, quantity and price (recalculated on the server from the catalog, never trusted from the browser).
- For custom items: a mockup, each layer's exact placement, the customer's **original file** (stored full quality in `data/designs/`), and **Download print file**, a transparent PNG of the whole print area with every layer in place (3000 px wide, or 300 DPI once `PRINT_AREA_CM` is set).
- Status (New, Placed on Zink, Shipped, Delivered, Cancelled), the Zink order number and a private note.

Placing the order on Zink is still manual until Zink offers an API.

## Payments

Every order needs a fixed **InstaPay deposit** (EGP 100, `src/config/payments.ts`); the rest is cash on delivery. InstaPay has no API, so customers upload a screenshot of the transfer and you mark the deposit *Received* in the order. The InstaPay address, number, payment link and QR code (`public/instapay-qr.png`) are set there too; if both the address and number are ever emptied, checkout pauses.

## Deploying

This store saves products, photos, orders and customer files to disk, so it needs a **Node.js server with a persistent disk**: a VPS (DigitalOcean, Hetzner, Hostinger VPS…), or Railway/Render/Fly with a mounted volume. **Not Vercel or Netlify**: their disks are wiped, so products and orders would disappear.

1. Copy the whole project to the server, **including the `data/` folder** (it's git-ignored, so copy it separately): it holds your products and photos.
2. Set the environment variables from `.env.example`: a strong `ADMIN_PASSWORD`, `SITE_URL=https://your-domain`, and `WINKY_DATA_DIR` if the volume lives elsewhere.
3. `npm ci && npm run build && npm start` (port 3000; put it behind HTTPS, e.g. Nginx/Caddy or the host's proxy). The dashboard login only works over HTTPS in production.
4. Back up the data folder regularly.

## Still to set

| Area | Where |
| --- | --- |
| Delivery fee | `SHIPPING_FEE` in `src/config/orders.ts` (`null` = confirmed on the phone). |
| Custom item prices | `src/config/pricing.ts`. |
| Print area size | `PRINT_AREA_CM` in `src/config/customization.ts` (ask Zink for their print specs). |

## Structure

```
src/
  app/(site)/          storefront: / · /shop · /shop/[slug] · /customize · /checkout (cash on delivery)
  app/admin/           dashboard: login, products, orders (+ server actions)
  app/api/admin/upload product photo upload (sharp → WebP)
  app/api/designs      customer artwork upload (originals for printing)
  app/media/[file]     serves uploaded photos
  config/              site switches, dashboard options, custom pricing, customization options
  lib/server/          auth, file storage, cached catalog reads, product validation
  lib/                 cart store, catalog helpers, checkout adapter, gsap setup
  components/
    admin/             dashboard UI (product form, row actions, login)
    art/               ProductVisual + drawn blank tote/case mockups (customizer)
    brand/             wordmark, wink glyph
    home/              hero, tote rail, case hand, customize teaser, drops, final CTA
    shop/              product card, grid + filters, product detail, add-to-bag
    customize/         customizer + DesignCanvas (drag / resize / rotate layers)
    cart/ checkout/ layout/ ui/
```

## Motion notes

- **The blink** is the transition language. The hero's eye (the dot of the "i") floats to the centre, forms the ● ◡ glyph, then swallows the screen and becomes the tote stage. Page navigations close the old page like an eyelid using the View Transitions API (unsupported browsers just navigate). The final section winks back.
- The hero is CSS `position: sticky`, so it stays usable if JavaScript or GSAP fails. GSAP only scrubs over it.
- Every GSAP scene is set up inside `gsap.matchMedia()` and reverted on cleanup. That matters because Cache Components hides pages with React `<Activity>` instead of unmounting them.
- `prefers-reduced-motion` removes pins, scrubs, idle loops and page transitions. All content renders in normal flow.
