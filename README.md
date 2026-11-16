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

## IBJA reference fetch

Manual and scheduled fetches use the server route `/api/gold-rate`. To enable live Metals.Dev rates, place `METALSDEV_API_KEY` in the local server environment (for example, in `.env.local`) and restart Next.js. The key is not exposed to the browser. Without it, fetch attempts are recorded as failed API log entries; manual reference rates and jeweller overrides remain available. The scheduler checks the configured two times while the admin dashboard is open in the browser.

Gold-rate requests use the Metals.Dev authority endpoint for IBJA, returning INR per gram when supported by the configured account.
