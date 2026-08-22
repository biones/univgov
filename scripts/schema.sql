-- Citizens (Universe Citizens / Users) Table
CREATE TABLE IF NOT EXISTS citizens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  citizen_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  google_id TEXT UNIQUE,
  avatar_url TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  verification_token TEXT,
  token_expires_at TEXT,
  btc_address TEXT,
  ln_address TEXT,
  btc_salary_rate INTEGER DEFAULT 0,
  uni_balance INTEGER NOT NULL DEFAULT 1000000,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT,
  ip TEXT,
  user_agent TEXT
);

-- Sessions Table for Authentication
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  citizen_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id) ON DELETE CASCADE
);

-- Cosmic Currency UNI Transactions Table
CREATE TABLE IF NOT EXISTS uni_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_id TEXT UNIQUE NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  memo TEXT,
  created_at TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_citizens_email ON citizens(email);
CREATE INDEX IF NOT EXISTS idx_citizens_citizen_id ON citizens(citizen_id);
CREATE INDEX IF NOT EXISTS idx_citizens_google_id ON citizens(google_id);
CREATE INDEX IF NOT EXISTS idx_citizens_token ON citizens(verification_token);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_citizen_id ON sessions(citizen_id);
CREATE INDEX IF NOT EXISTS idx_uni_tx_sender ON uni_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_uni_tx_receiver ON uni_transactions(receiver_id);
