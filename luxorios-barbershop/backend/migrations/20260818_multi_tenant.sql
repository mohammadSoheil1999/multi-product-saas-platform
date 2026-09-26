START TRANSACTION;

CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(64) PRIMARY KEY,
  subscription_id VARCHAR(191) NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  plan_slug VARCHAR(100) NOT NULL DEFAULT 'development',
  plan_limits JSON NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Jerusalem',
  default_language ENUM('ar','en','he') NOT NULL DEFAULT 'ar',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO tenants (id,name,slug,plan_limits)
VALUES ('luxorius-demo','Luxorius','luxorius-demo',JSON_OBJECT());

ALTER TABLE appointments DROP FOREIGN KEY fk_user_phone;

ALTER TABLE users
  ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'luxorius-demo' FIRST,
  DROP PRIMARY KEY,
  ADD COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
  ADD UNIQUE KEY uq_users_tenant_phone (tenant_id,phonenumber),
  ADD KEY idx_users_tenant_role (tenant_id,role),
  ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE appointments DROP PRIMARY KEY,
  ADD COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;

ALTER TABLE appointments
  ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'luxorius-demo' AFTER id,
  ADD UNIQUE KEY uq_appointments_tenant_slot (tenant_id,a_date,a_time),
  ADD KEY idx_appointments_tenant_customer (tenant_id,phonenumber),
  ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  ADD CONSTRAINT fk_appointments_customer FOREIGN KEY (tenant_id,phonenumber) REFERENCES users(tenant_id,phonenumber);

ALTER TABLE cancellations
  ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'luxorius-demo' AFTER id,
  DROP KEY idx_phone_time,
  ADD KEY idx_cancellations_tenant_phone_time (tenant_id,phonenumber,cancelled_at),
  ADD CONSTRAINT fk_cancellations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  ADD CONSTRAINT fk_cancellations_customer FOREIGN KEY (tenant_id,phonenumber) REFERENCES users(tenant_id,phonenumber);

ALTER TABLE push_subscriptions
  ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'luxorius-demo' AFTER id,
  ADD KEY idx_push_tenant_phone (tenant_id,phonenumber),
  ADD CONSTRAINT fk_push_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE site_settings
  ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'luxorius-demo' FIRST,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (tenant_id,id),
  ADD CONSTRAINT fk_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

COMMIT;
