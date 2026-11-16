# Sonasathi Dashboard Demo

Responsive Next.js dashboard for the Sonasathi admin and jeweller demo. Business records and compressed product images are stored in this browser profile; no application database is required.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first route is the demo sign-in page.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@sonasathi.demo` | `Admin@12345` |
| Jeweller 1 | `jeweller1@sonasathi.demo` | `Jeweller@12345` |
| Jeweller 2 | `jeweller2@sonasathi.demo` | `Jeweller@12345` |

Demo sign-in is client-side UI separation only. It is not production authentication or server-enforced authorization.

## Routes

- `/admin/dashboard` — overview
- `/admin/dashboard/accounts`
- `/admin/dashboard/shop-profiles`
- `/admin/dashboard/products`
- `/admin/dashboard/images`
- `/admin/dashboard/store-visits`
- `/admin/dashboard/categories`
- `/admin/dashboard/gold-rates`
- `/admin/dashboard/visiting-hours`
- `/admin/dashboard/settings`
- `/jeweller/dashboard` — jeweller-scoped overview
- `/jeweller/dashboard/profile`
- `/jeweller/dashboard/products`
- `/jeweller/dashboard/images`
- `/jeweller/dashboard/store-visits`
- `/jeweller/dashboard/gold-rates`
- `/jeweller/dashboard/visiting-hours`
- `/jeweller/dashboard/settings`
- `/visit-request` — same-origin public visit-request demo form

Seed records are created only when the versioned Sonasathi data key is absent. Existing browser data is not replaced during normal startup. Use Settings to export/import a JSON backup or explicitly restore the sample data.

Jewellery images are resized and converted to WebP in the browser, then stored as Base64 Data URLs in localStorage by default. Storage quota errors are shown without automatically deleting existing images. Existing IndexedDB demo images are migrated to localStorage as they are viewed when possible.

The public visit form writes to localStorage on the Next.js app origin. A separate storefront origin cannot read or share those records without a backend or a same-origin proxy.

## Jewellery pricing and local images

Product pricing can be entered manually or derived from the displayed breakdown (configured purity rate × net gold weight, making charge, making discount, stone charges, separate subtotal discount, GST estimate). A fixed selling discount is applied once to the actual price. Purity rates without an explicit jeweller override are proportional estimates based on the configured 24K reference; they are labelled as estimates, not IBJA quotes. GST is displayed for estimation only and should be confirmed for each transaction.

Jeweller overrides are scoped by shop and purity and expire after 24 hours. Their expiry is preserved in the audit history. Fetch schedule times use Asia/Kolkata; overdue slots are caught up when an admin opens the dashboard, with local slot de-duplication.

Manual and scheduled fetches use the server route `/api/gold-rates/ibja`. To enable Metals.Dev rates, place `METALS_DEV_API_KEY` in the server environment (for example, `.env.local`) and restart Next.js. The key stays on the server. The route requests the IBJA authority in INR per gram and returns the provider timestamp where available. A demo/reference rate is not a live quotation.

Jewellery images are converted to WebP in the browser and stored in localStorage for this demo. Images, listings and queries remain on this browser profile and app origin. They are not automatically accessible from another device or the separate hosted React storefront. Storage quota errors are shown without deleting existing images.

## Browser checks

Run `npm run test:e2e` to launch the configured Playwright browser tests for two jeweller image isolation/persistence, invalid image rejection and the public price breakdown. The Playwright config currently uses the standard Google Chrome install path on Windows.
