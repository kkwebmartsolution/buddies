-- Additive rental commerce schema. Amounts are integer paise; dates are inclusive.
CREATE TABLE IF NOT EXISTS rental_customers (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rental_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES rental_customers(id) ON DELETE CASCADE,
  INDEX (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rental_auth_attempts (
  bucket_key CHAR(64) PRIMARY KEY,
  attempts INT NOT NULL DEFAULT 1,
  expires_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rental_products (
  id CHAR(36) PRIMARY KEY,
  source_key VARCHAR(100) UNIQUE,
  kind VARCHAR(20) NOT NULL,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(1000) NOT NULL DEFAULT '',
  size VARCHAR(60) NOT NULL DEFAULT '',
  specifications TEXT NOT NULL,
  price_paise INT UNSIGNED NOT NULL DEFAULT 0,
  deposit_paise INT UNSIGNED NOT NULL DEFAULT 0,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  min_days INT UNSIGNED NOT NULL DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (active, kind)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rental_bookings (
  id CHAR(36) PRIMARY KEY,
  booking_number VARCHAR(30) NOT NULL UNIQUE,
  customer_id CHAR(36) NOT NULL,
  idempotency_key CHAR(36) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT NOT NULL,
  status VARCHAR(30) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
  rental_paise INT UNSIGNED NOT NULL,
  deposit_paise INT UNSIGNED NOT NULL,
  total_paise INT UNSIGNED NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(190) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  notes VARCHAR(1000) NOT NULL DEFAULT '',
  payment_reference VARCHAR(190) DEFAULT NULL,
  refund_reference VARCHAR(190) DEFAULT NULL,
  deposit_returned TINYINT(1) NOT NULL DEFAULT 0,
  deposit_reference VARCHAR(190) DEFAULT NULL,
  gateway_order_id VARCHAR(100) UNIQUE,
  gateway_payment_id VARCHAR(100) UNIQUE,
  hold_expires_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES rental_customers(id),
  UNIQUE (customer_id, idempotency_key),
  INDEX (status, start_date, end_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rental_booking_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  image VARCHAR(1000) NOT NULL DEFAULT '',
  size VARCHAR(60) NOT NULL DEFAULT '',
  quantity INT UNSIGNED NOT NULL,
  price_paise INT UNSIGNED NOT NULL,
  deposit_paise INT UNSIGNED NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES rental_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES rental_products(id),
  INDEX (product_id, booking_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rental_booking_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id CHAR(36) NOT NULL,
  event VARCHAR(60) NOT NULL,
  actor VARCHAR(60) NOT NULL,
  details VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES rental_bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rental_notification_outbox (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id CHAR(36) NOT NULL,
  event_id BIGINT UNSIGNED NOT NULL UNIQUE,
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  status VARCHAR(30) NOT NULL DEFAULT 'awaiting_integration',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES rental_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES rental_booking_events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Verified mobile identity is unique, including for migrated customer accounts.
CREATE TABLE IF NOT EXISTS rental_customer_phones (
  phone CHAR(10) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL UNIQUE,
  verified_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES rental_customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS rental_otp_challenges (
  phone CHAR(10) PRIMARY KEY,
  challenge_hash CHAR(64) NOT NULL UNIQUE,
  code_hash CHAR(64) NOT NULL,
  purpose VARCHAR(10) NOT NULL,
  profile_json TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  sent TINYINT NOT NULL DEFAULT 0,
  consumed TINYINT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  resend_at DATETIME NOT NULL,
  INDEX (expires_at)
) ENGINE=InnoDB;

-- One admin confirmation per booking. Do not backfill historical bookings.
CREATE TABLE IF NOT EXISTS rental_admin_notifications (
  booking_id CHAR(36) PRIMARY KEY,
  recipient VARCHAR(20) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  provider_message_id VARCHAR(255) DEFAULT NULL,
  last_error VARCHAR(500) NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES rental_bookings(id) ON DELETE CASCADE,
  INDEX (status, updated_at)
) ENGINE=InnoDB;
