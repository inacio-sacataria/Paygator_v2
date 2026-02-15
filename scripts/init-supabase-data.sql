-- Schema de dados Paygator para Supabase/PostgreSQL (igual à estrutura SQLite)
-- Executar uma vez no Supabase SQL Editor ou: psql $DATABASE_URL -f scripts/init-supabase-data.sql

CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  secret TEXT,
  provider TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER REFERENCES webhooks(id),
  provider TEXT NOT NULL,
  payload TEXT,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  processing_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  payment_id TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MZN',
  status TEXT DEFAULT 'pending',
  customer_id TEXT,
  vendor_id TEXT,
  metadata TEXT,
  return_url TEXT,
  iframe_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playfood_orders (
  id SERIAL PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  vendor_id TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  items TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  vendor_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  external_id TEXT,
  tax_id TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  vendor_share REAL DEFAULT 85,
  data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_payouts (
  id SERIAL PRIMARY KEY,
  payment_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  total_amount REAL NOT NULL,
  vendor_share_pct REAL NOT NULL,
  system_commission_pct REAL NOT NULL,
  system_commission_amount REAL NOT NULL,
  vendor_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  b2c_transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_payment_id ON vendor_payouts(payment_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);
