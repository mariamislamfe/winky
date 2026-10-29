# WINKY

Storefront for WINKY: phone cases and tote bags that wink back.

Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, GSAP + ScrollTrigger for scroll scenes, Motion for component springs and gestures.

```bash
npm install
npm run supabase:setup   # once, see "Supabase" below
npm run dev      # http://localhost:3000
npm run lint
npm run build && npm start
```

## Product dashboard (`/admin`)

Add, edit, publish/unpublish, reorder and delete your products. Each product has photos, a name, a price, a short line, a description, a showcase color, a "New" flag and, for cases, the phone models it fits. Saving updates the store immediately.

- **Login:** one password, set as `ADMIN_PASSWORD` in `.env.local` locally (already created, change it) and in your host's environment in production. Sessions last 7 days; changing the password signs everyone out.
- **Photos:** PNG, JPG or WebP up to 15 MB. They're auto-rotated, resized to 2000 px and converted to WebP. **Transparent PNG cut-outs** float freely on the homepage. Regular photos get rounded corners.
- **Where data lives:** Supabase (see below).
- **Sample products:** until you publish your first real product, the store shows 14 illustrated sample designs (`src/data/samples.ts`, prices are placeholders). As soon as one real product is live, every sample disappears automatically. If you unpublish everything, they come back.

## Orders (`/admin/orders`)

Checkout is **cash on delivery**: Zink prints, delivers and collects the cash. Each order is saved in Supabase and shows up in the dashboard right away with:

- Customer name, mobile (normalized to 01xxxxxxxxx), governorate, city, address and notes, with copy buttons for entering them on Zink.
- Every item with its phone model, quantity and price (recalculated on the server from the catalog, never trusted from the browser).
- For custom items, side by side: the design **on the product** (Download mockup, a PNG on white) and the **design only** (Download print file, a transparent PNG of the whole print area with every layer in place, 3000 px wide or 300 DPI once `PRINT_AREA_CM` is set). Below them, each layer's exact placement and the customer's **original file** (stored exactly as uploaded).
- Status (New, Placed on Zink, Shipped, Delivered, Cancelled), the Zink order number and a private note.

Placing the order on Zink is still manual until Zink offers an API.

## Prices, delivery and payments

- **Phone cases** all cost **EGP 120** and custom cases **EGP 150** (120 + 30 for printing your design): `CASE_PRICE` and `PRICING` in `src/config/pricing.ts`. This applies to every case, whatever price is saved on it. Tote bags take their price from the dashboard.
- **Tote bags** are "Coming soon": shown with a "Soon" sticker, but they don't open and can't be ordered (`totesComingSoon` in `src/config/site.ts`).
- **Delivery fees** are set per governorate in the dashboard (**Delivery**) and added to the order total at checkout. Besides the 27 governorates, the list has the areas the courier prices on their own (Ain Sokhna, Hurghada, Sharm El Sheikh, North Coast). A destination without a fee is confirmed on the phone.
- **Deposit:** every order needs an **InstaPay deposit of EGP 100 per item** (`src/config/payments.ts`, never more than the order total); the rest is cash on delivery. InstaPay has no API, so customers upload a screenshot of the transfer and you mark the deposit *Received* in the order. The InstaPay address, number, payment link and QR code (`public/instapay-qr.png`) are set there too; if both the address and number are ever emptied, checkout pauses.
- Orders are sent to `/api/orders` (a route handler, so a customer who opened checkout before a new deploy can still order).

## Supabase

Everything the store saves lives in Supabase, so the site itself keeps nothing on disk:

| What | Where in Supabase |
| --- | --- |
| Products | `products` table (one row per product, as JSON, in shop order) |
| Orders | `orders` table (the `number` column hands out WK-1001, WK-1002…) |
| Product photos | `products` storage bucket (public) |
| Customers' original designs | `designs` bucket (private) |
| InstaPay screenshots | `receipts` bucket (private) |
| Saved showcase colours, delivery fees | `settings` bucket (private, JSON files) |

Only the server talks to Supabase, with the **service role key**. Row level security is on with no policies, so the public key can't read anything. Customers' and dashboard uploads go straight from the browser to storage with one-time signed links from `/api/uploads`; the buckets only accept PNG, JPG and WebP within the size limits.

**Setting up a Supabase project:**

1. In Supabase, open **SQL Editor**, paste `supabase/schema.sql` and press **Run**.
2. Put the project URL, publishable key and service role key in `.env.local` (see `.env.example`).
3. Run `npm run supabase:setup`. It creates the storage buckets and checks the tables. On first run it also imports products from an old local `data/` folder, if there is one.

Supabase backs up the database daily on paid plans. On the free plan, export the tables now and then (Table editor → Export to CSV).

## Deploying

Any Node.js host works, including **Vercel**: nothing is stored on the server.

1. Push the project to GitHub and import it in Vercel (or your host).
2. Set the environment variables from `.env.example`: a strong `ADMIN_PASSWORD`, `SITE_URL=https://your-domain`, and the three Supabase variables.
3. Deploy. The dashboard login only works over HTTPS in production, which Vercel provides.

## Still to set

| Area | Where |
| --- | --- |
| Print area size | `PRINT_AREA_CM` in `src/config/customization.ts` (ask Zink for their print specs). |

## Structure

```
src/
  app/(site)/          storefront: / · /shop · /shop/[slug] · /customize · /checkout (cash on delivery)
  app/admin/           dashboard: login, products, orders (+ server actions)
  app/api/uploads      one-time upload links (designs, receipts, dashboard photos)
  app/api/admin/       photo processing (sharp → WebP), private design/receipt files
  config/              site switches, dashboard options, custom pricing, customization options
  lib/server/          auth, Supabase storage, cached catalog reads, product + order validation
supabase/schema.sql    database tables
scripts/               supabase:setup (buckets + import)
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
