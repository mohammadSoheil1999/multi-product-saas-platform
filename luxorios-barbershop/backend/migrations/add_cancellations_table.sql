-- Track user appointment cancellations for 3-hour cooldown
CREATE TABLE IF NOT EXISTS `cancellations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `phonenumber` VARCHAR(20) NOT NULL,
  `cancelled_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_phone_time` (`phonenumber`, `cancelled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
