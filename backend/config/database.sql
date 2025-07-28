-- Tworzy bazę i tabelę (uruchom ręcznie lub przez skrypt)
CREATE DATABASE IF NOT EXISTS domains CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE domeny;

CREATE TABLE IF NOT EXISTS domains (
  id INT AUTO_INCREMENT PRIMARY KEY,
  domain VARCHAR(255) UNIQUE NOT NULL,
  released_date DATE NOT NULL,
  last_checked DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  days_available INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indeksy dla wydajności
CREATE INDEX idx_available ON domains(is_available);
CREATE INDEX idx_days ON domains(days_available);
CREATE INDEX idx_domain ON domains(domain);