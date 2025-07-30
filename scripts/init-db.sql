-- Script de inicialização do banco de dados Paygator
-- Este script é executado automaticamente quando o container PostgreSQL é criado

-- Conectar ao banco paygator
\c paygator;

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  external_payment_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MZN',
  payment_method VARCHAR(50),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  order_id VARCHAR(255),
  return_url TEXT,
  iframe_link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de API
CREATE TABLE IF NOT EXISTS api_logs (
  id SERIAL PRIMARY KEY,
  correlation_id VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  api_key VARCHAR(255),
  webhook_signature VARCHAR(255),
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  content_length INTEGER,
  error_message TEXT,
  service_name VARCHAR(100) DEFAULT 'paygator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de pagamentos
CREATE TABLE IF NOT EXISTS payment_logs (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR(255) NOT NULL,
  external_payment_id VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  customer_email VARCHAR(255),
  error_message TEXT,
  metadata JSONB,
  correlation_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de autenticação
CREATE TABLE IF NOT EXISTS auth_logs (
  id SERIAL PRIMARY KEY,
  correlation_id VARCHAR(255) NOT NULL,
  api_key VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  action VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_api_logs_correlation_id ON api_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_method ON api_logs(method);
CREATE INDEX IF NOT EXISTS idx_api_logs_response_status ON api_logs(response_status);

CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_logs_action ON payment_logs(action);

CREATE INDEX IF NOT EXISTS idx_auth_logs_correlation_id ON auth_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);

-- Inserir dados de exemplo
INSERT INTO payments (payment_id, external_payment_id, amount, currency, payment_method, customer_email, customer_name, status) VALUES
('pay_001', 'ext_001', 1000.00, 'MZN', 'card', 'cliente1@example.com', 'João Silva', 'approved'),
('pay_002', 'ext_002', 2500.50, 'MZN', 'mobile_money', 'cliente2@example.com', 'Maria Santos', 'pending'),
('pay_003', 'ext_003', 750.25, 'MZN', 'card', 'cliente3@example.com', 'Pedro Costa', 'failed')
ON CONFLICT (payment_id) DO NOTHING;

-- Inserir logs de exemplo
INSERT INTO api_logs (correlation_id, method, url, ip_address, response_status, response_time_ms) VALUES
('corr_001', 'POST', '/api/v1/payments', '127.0.0.1', 201, 150),
('corr_002', 'GET', '/api/v1/payments/pay_001', '127.0.0.1', 200, 45),
('corr_003', 'POST', '/api/v1/webhooks', '127.0.0.1', 200, 89)
ON CONFLICT DO NOTHING;

-- Inserir logs de pagamento de exemplo
INSERT INTO payment_logs (payment_id, action, new_status, amount, currency, customer_email) VALUES
('pay_001', 'created', 'pending', 1000.00, 'MZN', 'cliente1@example.com'),
('pay_001', 'approved', 'approved', 1000.00, 'MZN', 'cliente1@example.com'),
('pay_002', 'created', 'pending', 2500.50, 'MZN', 'cliente2@example.com')
ON CONFLICT DO NOTHING;

-- Criar usuário para a aplicação (opcional)
-- CREATE USER paygator_app WITH PASSWORD 'app_password';
-- GRANT ALL PRIVILEGES ON DATABASE paygator TO paygator_app;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO paygator_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO paygator_app;

-- Mostrar estatísticas
SELECT 
  'payments' as table_name, 
  COUNT(*) as record_count 
FROM payments
UNION ALL
SELECT 
  'api_logs' as table_name, 
  COUNT(*) as record_count 
FROM api_logs
UNION ALL
SELECT 
  'payment_logs' as table_name, 
  COUNT(*) as record_count 
FROM payment_logs
UNION ALL
SELECT 
  'auth_logs' as table_name, 
  COUNT(*) as record_count 
FROM auth_logs; 