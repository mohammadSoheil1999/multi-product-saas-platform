# Appointment multi-tenancy

The MariaDB appointment application uses a shared-schema tenant model. `tenants.id` is included in every business-owned query and is embedded in the verified JWT at login. The browser may select a business for public registration/login with `?tenant=<slug>` or `X-Tenant`, but authenticated authorization always uses the signed token's `tenantId`.

Tenant-scoped uniqueness:

- Customers: `UNIQUE (tenant_id, phonenumber)`
- Appointment slots: `UNIQUE (tenant_id, a_date, a_time)`
- Settings: `PRIMARY KEY (tenant_id, id)`

The pre-migration data is preserved under `luxorius-demo`. The backup is `backend/backups/appointments-before-tenancy-20260818.sql`; the migration is `backend/migrations/20260818_multi_tenant.sql`.

Development sample businesses:

| URL | Owner phone | Password |
|---|---|---|
| `http://10.0.0.21:5173/?tenant=elite-barber` | `050-100-0000` | `Demo123!` |
| `http://10.0.0.21:5173/?tenant=smile-clinic` | `050-200-0000` | `Demo123!` |
| `http://10.0.0.21:5173/?tenant=glow-beauty` | `050-300-0000` | `Demo123!` |

Each sample business has three normal customers and nine appointments—three per customer. Run `npm run db:seed-tenants` from `backend` only in development. The seed refuses to run when `NODE_ENV=production`.
