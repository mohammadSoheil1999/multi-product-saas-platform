ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE TABLE IF NOT EXISTS customer_sessions(
  token_hash text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  customer_id bigint not null references customers(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS customer_sessions_lookup_idx ON customer_sessions(tenant_id,customer_id,expires_at);
