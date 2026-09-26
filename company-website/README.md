# YourCompany commercial hub

An independently deployable Next.js commercial website and SaaS control plane for the products in the parent workspace. It combines multilingual marketing, unchanged public demos, accounts, database-driven catalog/pricing, subscription entitlements, secure product provisioning, client operations, and administration. Branding is centralized in `src/config/brand.ts`; `YourCompany` is intentionally temporary.

## Existing product audit

The applications remain independently deployable. Their demo behavior and URLs are preserved; production-mode adapters live alongside them:

| Folder | Product | Stack | Run |
|---|---|---|---|
| `../luxorios-barbershop` | Appointment platform | React 19/Vite frontend; Express backend; MongoDB/MySQL dependencies | `npm run dev` in `frontend` and `backend` |
| `../e-commerce` | Nova Market | React/TypeScript/Vite + Capacitor demo; Express/PostgreSQL production API | `npm run dev`; API in `server/` |
| `../realEstate` | KeyHaven | React/TypeScript/Vite demo; Express/PostgreSQL production API | `npm run dev`; API in `server/` |
| `../openDelivery` | OpenDelivery | Next.js 16, React 19, PostgreSQL, Prisma 7, Better Auth, Redis | follow its README/Docker setup |

The hub links to configured demo URLs. It does not import their code, share their database, start them, or alter their environment.

## Architecture

```text
Cloudflare / TLS
├── company.com → this Next.js application → PostgreSQL / email / storage / billing
└── demo routes or subdomains
    ├── booking app
    ├── store app
    ├── property app
    └── delivery app
```

Core modules:

- `src/config`: brand and development product registry
- `src/locales`: English, Arabic, Hebrew dictionaries; RTL uses the `dir` attribute and logical CSS
- `prisma/schema.prisma`: extensible products, plans, subscriptions, entitlements, billing events, onboarding, support, CMS and auditing
- `src/lib/auth.ts`: Better Auth with verified email, password reset and secure database sessions
- `src/lib/payments.ts`: provider contract, development mock adapter, signed/idempotent event processing
- `src/lib/provisioning.ts`: signed, idempotent product provisioning and secure launch handoff
- `src/lib/authorization.ts`: server-side user/admin/ownership guards
- `src/app/[locale]/dashboard` and `admin`: separate authorized workspaces

Products and prices are database records. The TypeScript registry supplies polished build-time marketing fallback and environment-based demo URLs; admin-managed `Product`, `ProductPlan`, and `DemoConfiguration` records are the source for commerce operations.

## Owner administration

Administrators use `/{locale}/admin` as the owner control plane. The interface now supports:

- creating and editing services, publishing state, imagery, ordering, and production URLs;
- creating and editing monthly/annual membership plans, prices, features, limits, trials, and availability;
- adding and editing demo instances and demo credentials;
- activating, suspending, cancelling, or expiring memberships and controlling product provisioning;
- managing client account status, customization requests, support replies, leads, and localized content blocks;
- reviewing an immutable activity trail for owner and commercial operations.

Catalog changes are database-driven and reflected by the public pricing/demo surfaces after cache revalidation. Destructive deletion is intentionally replaced by archive/deactivate states so subscriptions and audit history remain intact.

## Local setup

Requires Node 22+, npm, Docker, and PostgreSQL 17.

For this development machine, where PostgreSQL/Docker is unavailable, use the persistent local PostgreSQL-compatible development database:

```bash
npm run dev:local
```

This starts PGlite on port 5434, applies checked-in migrations through `scripts/local-migrate.mjs`, and starts Next.js. PGlite is development-only; production still requires PostgreSQL and `npm run db:migrate:deploy`.

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate:deploy
NODE_ENV=development npm run db:seed
npm run dev
```

Development seed credentials (never created in production):

- Admin: `admin@example.test` / `ChangeMe123!` unless overridden by `DEV_ADMIN_*`
- Client: `client@example.test` / `ChangeMe123!`

The seed command exits in production. Use checked-in migrations for deployments; never use `prisma db push` as a release process.

## Authentication and authorization

Better Auth owns credential hashing, email verification, password reset, HTTP-only sessions and revocation. Admin and client checks execute on the server. Client database queries always include the current user ID; never accept a browser-provided owner ID. Add distributed rate limiting before public launch (the dependencies and provider boundary are prepared), plus CAPTCHA at public form boundaries if abuse warrants it.

## Payments and webhooks

Set `PAYMENT_PROVIDER=disabled` while payment integration is deferred. Choosing a plan then creates an auditable manual request without granting an entitlement. An administrator must select **Activate without payment**, then provision the product. No charge is claimed or simulated in this mode.

`PaymentProvider` exposes customer, checkout, cancellation, plan change, invoices, capabilities, and webhook verification. `PAYMENT_PROVIDER=mock` provides local simulated checkout and throws in production. Add a production adapter (for the selected regional provider) without changing subscription services. Provider webhook events have a unique ID and are transactionally deduplicated; only verified events update subscription status and entitlements. Frontend success redirects are never proof of payment.

## Email, storage, analytics and monitoring

Email uses a template/provider boundary and refuses missing production configuration. Connect the selected service in `src/lib/email.ts`. Uploads should use presigned private S3/R2 URLs, unique object keys, server MIME/size checks, and malware scanning; do not enable local production uploads. Add privacy-conscious analytics behind an adapter and send only event names/product IDs—never form bodies, credentials, tokens, or payment data. Configure `SENTRY_DSN` through a server-only monitoring adapter and keep safe user-facing errors.

## Demos

Set each `NEXT_PUBLIC_*_DEMO_URL` or edit `DemoConfiguration` through administration. Demo launch shows a data-reset/sensitive-information warning and opens a new tab, avoiding iframe/header conflicts. Demo credentials belong only in `DemoConfiguration.credentials` and must never be production credentials.

## Adding another SaaS product

1. Create a `Product` in admin with a unique slug, description, imagery, status and order.
2. Add one or more `ProductPlan` records with integer minor-unit prices, JSON features/limits and optional trial days.
3. Add a demo configuration and screenshots.
4. Add localized marketing content/CMS blocks.
5. Configure its production provisioning endpoint and unique shared secret.

No subscription, entitlement, support, admin, or billing schema change is required.

See [`PRODUCT_DEPLOYMENT.md`](./PRODUCT_DEPLOYMENT.md) for dual demo/production configuration, migrations, secure dashboard handoff, and the payment-disabled plan activation flow.

## Deployment and operations

The multi-stage Docker image runs as a non-root user. Run `npm run db:migrate:deploy` as a one-off release job before switching application traffic. The compose file starts only this hub and PostgreSQL; it deliberately does not start product demos. Example path and subdomain reverse proxies live in `deploy/`.

Backups: enable encrypted daily snapshots, off-server copies, at least 30-day retention or an approved policy, point-in-time recovery where available, and quarterly isolated restore tests. Document recovery time/recovery point objectives and access to restore credentials.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

CI runs installation, Prisma generation/migrations, lint, typecheck, unit tests, and build. Review `PRODUCTION_CHECKLIST.md` before any launch.
