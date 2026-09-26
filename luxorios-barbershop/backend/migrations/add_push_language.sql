ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS language ENUM('ar', 'en', 'he') NOT NULL DEFAULT 'ar';
