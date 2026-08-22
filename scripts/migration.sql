-- Migration for Cloudflare D1 univgov-db
ALTER TABLE citizens ADD COLUMN email TEXT;
ALTER TABLE citizens ADD COLUMN google_id TEXT;
ALTER TABLE citizens ADD COLUMN avatar_url TEXT;
ALTER TABLE citizens ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1;
ALTER TABLE citizens ADD COLUMN verification_token TEXT;
ALTER TABLE citizens ADD COLUMN token_expires_at TEXT;
ALTER TABLE citizens ADD COLUMN btc_address TEXT;
ALTER TABLE citizens ADD COLUMN ln_address TEXT;
ALTER TABLE citizens ADD COLUMN btc_salary_rate INTEGER DEFAULT 0;
ALTER TABLE citizens ADD COLUMN uni_balance INTEGER NOT NULL DEFAULT 1000000;
ALTER TABLE citizens ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE citizens ADD COLUMN updated_at TEXT;
ALTER TABLE citizens ADD COLUMN last_login_at TEXT;

CREATE INDEX IF NOT EXISTS idx_citizens_email ON citizens(email);
CREATE INDEX IF NOT EXISTS idx_citizens_citizen_id ON citizens(citizen_id);
CREATE INDEX IF NOT EXISTS idx_citizens_google_id ON citizens(google_id);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  citizen_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_citizen_id ON sessions(citizen_id);

CREATE TABLE IF NOT EXISTS uni_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_id TEXT UNIQUE NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  memo TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_uni_tx_sender ON uni_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_uni_tx_receiver ON uni_transactions(receiver_id);
