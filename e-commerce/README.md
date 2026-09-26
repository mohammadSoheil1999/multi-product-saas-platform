# Nova Market — demo and production E-Commerce

The original demo remains the default with `VITE_APP_MODE=demo`. A signed company-dashboard handoff activates the database-backed tenant in the same frontend deployment, so the demo is preserved while subscribed stores use the production API. The independent API lives in `server/`, uses PostgreSQL, enforces tenant sessions, and accepts signed provisioning/handoff requests. Payments remain disabled.

## Database-backed local setup

```bash
cd server
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

`npm run db:seed` is development-only and creates three stores, three customers for each store, three products per store, and three orders for each customer. The seed is idempotent and refuses to run when `NODE_ENV=production`.

The commerce schema includes tenants, product sessions, provisioning events, customers, secure customer sessions, addresses, categories, products, variants, carts, cart items, orders, normalized order items, inventory movements, and audit logs. All business records carry a tenant relationship. Customer passwords use Node's memory-hard `scrypt` implementation with unique salts; raw passwords are never stored. Order totals and stock are calculated and updated by the server in a database transaction; browser totals are ignored.

The production API also exposes tenant-authenticated catalog creation/editing and order-status management. These endpoints are intended for the subscribed store dashboard session created through the signed company-hub handoff.

Seeded customer password: `Demo123!`. Registration and login are available from the Account screen on tenant-specific development URLs. Seed accounts are development data only and are never created automatically in production.

Nova Market is a polished portfolio storefront and business dashboard built with React, TypeScript, and Vite. It supports English, Arabic, and Hebrew (including full RTL), persistent cart/wishlist/order state, coupon calculations, simulated checkout, order tracking, inventory views, and an interactive admin order workflow.

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

Open the URL printed by Vite. For a production bundle:

```bash
npm run build
npm run preview
```

This self-contained portfolio build uses seeded TypeScript data and browser `localStorage`, so there is no database migration to run. Reset the browser's site storage to restore all seeded demo data.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo-shop.local` | `Demo123!` |
| Customer | `customer@demo-shop.local` | `Demo123!` |

Authentication is represented as a local demo session. Use **Account → Admin dashboard** to demonstrate the shared customer/admin order workflow.

## Demo payments

This application uses a simulated payment provider. It does not process real payments. Never use real credit-card information in the demo payment form.

- Success: `4242 4242 4242 4242`, expiry `12/30`, CVV `123`
- Decline: `4000 0000 0000 0002`, expiry `12/30`, CVV `123`

Card form values exist only in component memory while checkout is open. Orders persist only `payment method`, `SIMULATED` status, and the last four digits. The provider abstraction lives in `src/services/payment.ts`. A real provider cannot initialize in this demo build.

## Coupons

- `WELCOME10`: 10% off
- `SAVE20`: 20% off orders of $200+, capped at $80
- `FREESHIP`: free standard shipping

## Languages and RTL

- English: LTR
- العربية: RTL
- עברית: RTL

The header selector persists the chosen language and updates the document language/direction. Visible customer/admin labels are routed through `src/i18n.ts`; directional styling is handled globally.

## Architecture

```text
src/
  App.tsx                 Customer + admin application screens
  data.ts                 36 seeded products, categories, orders
  i18n.ts                 EN / AR / HE dictionaries
  services/payment.ts     PaymentProvider + FakePaymentProvider
  styles.css              Responsive LTR/RTL design system
  types.ts                Domain models
```

## Native mobile applications

Real Android and iOS projects are included under `android/` and `ios/`. They support native notification permission, push registration, local notifications, deep links, splash screens, and status-bar integration. See [MOBILE.md](./MOBILE.md) for Android Studio, Xcode, signing, and notification configuration.

For a production implementation, replace local state with API repositories while retaining the domain types and service interfaces. Store authentication server-side, validate inventory and coupons transactionally, upload media to object storage, and implement a relational schema for users, addresses, products, variants, categories, carts, wishlists, orders, coupons, reviews, inventory, notifications, and payment audit records.

## Important demo configuration

Set `VITE_DEMO_MODE=true`. The application intentionally contains no Stripe, PayPal, wallet, banking, or external payment SDK. Changing this setting to `false` does not enable payments—the payment factory throws by design until a developer explicitly implements and audits a production provider.
