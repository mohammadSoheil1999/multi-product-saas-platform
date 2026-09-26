# KeyHaven Property Marketplace — demo and production

The original demo remains the default with `VITE_APP_MODE=demo`. A separate PostgreSQL production API lives in `server/`; it accepts signed plan provisioning, secure company-dashboard handoffs, and persists inquiries/viewing requests. Payments remain disabled. See `../company-website/PRODUCT_DEPLOYMENT.md`.

The production API includes tenant-authenticated listing creation/editing/publishing, the complete lead inbox, and dashboard totals. Public demo behavior remains isolated from subscribed production tenants.

A presentation-ready multilingual real-estate marketplace for web and mobile. KeyHaven includes 42 seeded listings, customer search and saved homes, property detail and mortgage tools, inquiry/viewing flows, clickable map markers, agent/admin dashboards, and a strictly simulated payment experience.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local URL printed by Vite. Production build:

```bash
npm run build
npm run preview
```

No database service is required for this portfolio build. Demo records are seeded in `src/data.ts`; user interactions (favorites, recent properties, leads, role and demo transactions) persist in browser `localStorage`.

## Demo users

All accounts use password `Demo123!`.

| Role | Email |
| --- | --- |
| Admin | `admin@realestate-demo.local` |
| Agent | `agent@realestate-demo.local` |
| Customer | `customer@realestate-demo.local` |

The login form provides one-click account selectors.

## Demo payment

No real payment processing exists. The app only instantiates `FakePaymentProvider` through the reusable `PaymentProvider` interface. No network call is made and full card details/CVV are never stored. Stored transaction metadata is marked `simulation: true`.

- Successful card: `4242 4242 4242 4242`
- Declined card: `4000 0000 0000 0002`
- Expiry: `12/30`
- CVV: `123`

Use `VITE_DEMO_MODE=true`. This codebase contains no real payment SDK, credentials, or gateway.

## Languages and direction

- English — LTR
- Arabic — RTL
- Hebrew — RTL

The language selection is remembered and updates the document `lang` and `dir` attributes. UI text is sourced from `src/i18n.ts`; property content supports localized title and description records.

## Architecture

- `src/config.ts` — centralized white-label brand and contact settings
- `src/data.ts` — seeded multilingual marketplace catalog and agents
- `src/i18n.ts` — English, Arabic, and Hebrew strings
- `src/payments/` — provider contract and fake-only implementation
- `src/App.tsx` — application flows and views
- `src/styles.css` — responsive desktop/mobile and bidirectional design system

## Demo flow

Switch language from the header, search or filter homes, toggle map mode, open a marker/listing, save it, use the mortgage estimate, submit a viewing or inquiry, and run a simulated reservation using the successful/declined card shortcuts. Sign in with the agent or admin demo account to show their respective analytics dashboards.

> KeyHaven is a portfolio demonstration. All listings, people, leads, revenue, reservations, and payments are fictional and simulated.
