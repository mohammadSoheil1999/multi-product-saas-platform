CREATE TABLE IF NOT EXISTS site_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  shop_name VARCHAR(80) NOT NULL DEFAULT 'Luxorius',
  primary_color CHAR(7) NOT NULL DEFAULT '#3f5b4c',
  accent_color CHAR(7) NOT NULL DEFAULT '#9a783d',
  surface_color CHAR(7) NOT NULL DEFAULT '#fbfaf7',
  background_style ENUM('sand', 'sage', 'charcoal', 'classic') NOT NULL DEFAULT 'sand',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT single_settings_row CHECK (id = 1)
);

INSERT IGNORE INTO site_settings (id, shop_name) VALUES (1, 'Luxorius');
