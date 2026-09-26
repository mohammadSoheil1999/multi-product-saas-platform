# Demo and production product deployments

Each product repository supports separate deployments. Never point a demo and a production deployment at the same database.

| Product | Demo | Production | Company plans |
|---|---|---|---|
| Appointment Booking | Existing Vite + Express demo | Existing Express/MySQL application | Connected |
| E-Commerce | Existing local-data Vite demo | `../e-commerce/server` + PostgreSQL | Connected |
| Real Estate | Existing local-data Vite demo | `../realEstate/server` + PostgreSQL | Connected |
| OpenDelivery | Existing independent application | Existing Next.js/PostgreSQL application | Not offered; personal project |

## Safety boundary

- Demos retain their URLs and use `APP_MODE=demo` / `VITE_APP_MODE=demo`.
- Product provisioning endpoints return `403` in demo mode.
- Production uses separate databases and `APP_MODE=production`.
- Use a unique, matching 32+ character provisioning secret in the company and each product.
- Provisioning is timestamped, HMAC-signed, idempotent, and carries the exact database plan features and limits.
- E-Commerce and Real Estate exchange a five-minute company handoff for a hashed, HTTP-only product session. APIs derive tenants from the server session—not a browser-provided tenant ID.
- Payments are disabled. A plan selection creates a request; an admin must explicitly activate it before provisioning.

## E-Commerce

```bash
cd ../e-commerce/server
cp .env.example .env
# Set APP_MODE=production, DATABASE_URL, PROVISIONING_SECRET and ALLOWED_ORIGIN
npm install
npm run db:migrate
npm start
```

Build its frontend with `VITE_APP_MODE=production` and `VITE_API_URL` pointing to the API. Production orders persist in PostgreSQL; checkout does not charge a card.

## Real Estate

```bash
cd ../realEstate/server
cp .env.example .env
# Set APP_MODE=production, DATABASE_URL, PROVISIONING_SECRET and ALLOWED_ORIGIN
npm install
npm run db:migrate
npm start
```

Build its frontend with `VITE_APP_MODE=production` and `VITE_API_URL` pointing to the API. Production inquiries and viewing requests persist in PostgreSQL; reservation payments remain disabled.

## Company workflow

1. Customer chooses a database-backed plan.
2. `PAYMENT_PROVIDER=disabled` creates a manual request with no entitlement.
3. Admin selects **Activate without payment**; the action is audit logged.
4. Admin selects **Start setup**; exact plan limits are sent to the product.
5. Product creates or updates its tenant and returns the access URL.
6. Customer uses **Open product** from their company dashboard through an ownership-checked handoff.

Apply the company migration with `npm run db:migrate:deploy`. Apply each product schema with its server's `npm run db:migrate`.
