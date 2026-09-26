ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id bigint;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'UNPAID';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS customers(
  id bigserial primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  status text not null default 'ACTIVE' check(status in('ACTIVE','SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,email)
);
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_tenant_number_uidx ON orders(tenant_id,order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS customers_tenant_idx ON customers(tenant_id,created_at desc);

CREATE TABLE IF NOT EXISTS customer_addresses(
  id bigserial primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  customer_id bigint not null references customers(id) on delete cascade,
  label text not null default 'Home',
  city text not null,
  street text not null,
  postal_code text,
  country text not null default 'IL',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS addresses_tenant_customer_idx ON customer_addresses(tenant_id,customer_id);

CREATE TABLE IF NOT EXISTS categories(
  id bigserial primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  active boolean not null default true,
  display_order integer not null default 0,
  unique(tenant_id,slug)
);
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id bigint references categories(id) on delete set null;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS product_variants(
  id bigserial primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  product_id bigint not null references products(id) on delete cascade,
  sku text not null,
  name text not null,
  price_minor integer not null check(price_minor>=0),
  stock integer not null default 0 check(stock>=0),
  active boolean not null default true,
  unique(tenant_id,sku)
);
CREATE INDEX IF NOT EXISTS variants_tenant_product_idx ON product_variants(tenant_id,product_id);

CREATE TABLE IF NOT EXISTS order_items(
  id bigserial primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  order_id bigint not null references orders(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  variant_id bigint references product_variants(id) on delete set null,
  sku text not null,
  product_name text not null,
  quantity integer not null check(quantity>0),
  unit_price_minor integer not null check(unit_price_minor>=0),
  line_total_minor integer not null check(line_total_minor>=0)
);
CREATE INDEX IF NOT EXISTS order_items_tenant_order_idx ON order_items(tenant_id,order_id);

CREATE TABLE IF NOT EXISTS inventory_movements(
  id bigserial primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  variant_id bigint references product_variants(id) on delete set null,
  order_id bigint references orders(id) on delete set null,
  quantity_delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS inventory_tenant_created_idx ON inventory_movements(tenant_id,created_at desc);

CREATE TABLE IF NOT EXISTS carts(
  id bigserial primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  customer_id bigint not null references customers(id) on delete cascade,
  status text not null default 'ACTIVE' check(status in('ACTIVE','CONVERTED','ABANDONED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE UNIQUE INDEX IF NOT EXISTS carts_one_active_per_customer ON carts(tenant_id,customer_id) WHERE status='ACTIVE';

CREATE TABLE IF NOT EXISTS cart_items(
  id bigserial primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  cart_id bigint not null references carts(id) on delete cascade,
  product_id bigint not null references products(id) on delete cascade,
  variant_id bigint references product_variants(id) on delete cascade,
  quantity integer not null check(quantity>0),
  created_at timestamptz not null default now(),
  unique(cart_id,product_id,variant_id)
);

CREATE TABLE IF NOT EXISTS commerce_audit_logs(
  id bigserial primary key,
  tenant_id text references tenants(id) on delete set null,
  actor text not null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
