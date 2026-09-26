# OpenDelivery

OpenDelivery is a cash-only, multi-tenant technology marketplace connecting businesses with independent freelance couriers. It is not a delivery company, merchant marketplace, employer, or payment intermediary. Delivery arrangements and cash payments are made directly between the participating business/customer and courier. The application contains no payment processor, wallet, escrow, checkout, commission, or money-transfer code.

## Architecture

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS, PostgreSQL, Prisma 7, Better Auth 1.6, Zod, Upstash-compatible Redis rate limiting, and provider abstractions for transactional email. Major server operations live under `server/services`; validation and state rules live under `features`; route handlers remain thin. Every major query is tenant-scoped. Private destination/contact details are omitted from discovery projections and authorized server-side after selection.

Claim and offer selection use serializable PostgreSQL transactions plus conditional atomic updates. Status changes use an explicit state machine and compare-and-set writes; every accepted change appends a `DeliveryStatusHistory` row. Monetary values are integer minor units and are informational cash records only.

## Local setup

Prerequisites: Node 22+, Docker, and PostgreSQL 17 recommended.

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run db:generate
npm run db:migrate:deploy
NODE_ENV=development npm run db:seed
npm run dev
```

The seed command is explicitly blocked when `NODE_ENV=production`. Demo addresses, users, and phones use non-routable/example values. Never seed a production database.

## Database and migrations

Create development migrations with `npm run db:migrate`. Production must use `npm run db:migrate:deploy`; never use `prisma db push`. Review generated SQL, snapshot/backup first, deploy backward-compatible application changes, apply migrations, then remove deprecated fields in a later release.

## Authentication and security

Better Auth provides database-backed, HTTP-only sessions and revocation. Passwords use Argon2id. Registration requires email verification and versioned terms/privacy acceptance. Production refuses an HTTP `APP_URL`, weak/demo secret, missing email provider, or missing Redis on protected rate-limited operations. Configure the supplied CSP/HSTS headers behind HTTPS. Ensure the reverse proxy overwrites—not appends—trusted forwarding headers.

Uploads must use presigned URLs to private S3-compatible storage, with server-side MIME/size validation and unique object keys; local production uploads are prohibited. Configure bucket malware scanning and lifecycle retention before enabling upload UI.

## Realtime, maps, and notifications

The schema and event boundaries cover delivery status, offers, chat, and notifications. Configure Ably credentials and publish only opaque event IDs; clients refetch authorized data. Channels must be tenant/user/delivery scoped and token-authenticated. Do not put customer details in event payloads or previews. Map rendering targets MapLibre/OpenStreetMap; production should use a contracted tile/geocoding provider and honor attribution/rate limits. Navigation is delegated to Waze/Google Maps links.

## Email

Set `EMAIL_API_KEY` and `EMAIL_FROM`. Development logs a verification link when no provider key exists; production fails closed and never logs tokens. Add localized templates before launch. Password reset and security-notice templates should be reviewed in staging.

## Tests and CI

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run build`. CI provisions PostgreSQL, applies checked-in migrations, and runs the validation gates. Concurrency integration tests should execute against PostgreSQL—not an in-memory substitute—and issue simultaneous claim/offer/status requests.

## Deployment

The multi-stage Dockerfile produces a non-root standalone Next.js image. Run migrations as a one-off release job before starting new containers. Terminate TLS at the platform/reverse proxy, forward port 3000 internally, and monitor `/api/health`. On Vercel, use managed PostgreSQL, Redis, object storage, and Ably; do not place secrets in `NEXT_PUBLIC_*` variables.

## Backups and restore

Enable provider-managed daily PostgreSQL backups with at least 30-day retention and point-in-time recovery where available. Document encryption and access. Quarterly, restore the newest backup into an isolated environment, run integrity checks and a critical-flow smoke test, then destroy the restored copy securely. A backup is not considered operational until restore has been tested.

## Privacy and legal review

Customer phone, exact destination, and notes have configurable retention. A scheduled privileged job should anonymize expired fields while preserving non-identifying aggregates and record the operation. Account export/deletion requests require identity verification, audit records, and preservation rules for historical deliveries. Generated legal templates are not legal advice; qualified counsel must review marketplace classification, transport restrictions, tax, insurance, privacy, employment, and local regulatory duties before public launch.

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) before deployment.
