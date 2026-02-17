const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('🐘 Configurando PostgreSQL Local...');

// Configuração do PostgreSQL local
const localConfig = {
  host: 'localhost',
  port: 5432,
  database: 'paygator',
  user: 'postgres',
  password: 'postgres123',
  ssl: false
};

// Scripts SQL para criar as tabelas
const createTablesSQL = `
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
  -- Campos usados pela app (modelo "novo")
  provider TEXT,
  customer_id TEXT,
  vendor_id TEXT,
  metadata TEXT,
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
`;

// Dados de exemplo
const sampleDataSQL = `
-- Inserir alguns pagamentos de exemplo
INSERT INTO payments (payment_id, external_payment_id, amount, currency, payment_method, customer_email, customer_name, status) VALUES
('pay_001', 'ext_001', 1000.00, 'MZN', 'card', 'cliente1@example.com', 'João Silva', 'approved'),
('pay_002', 'ext_002', 2500.50, 'MZN', 'mobile_money', 'cliente2@example.com', 'Maria Santos', 'pending'),
('pay_003', 'ext_003', 750.25, 'MZN', 'card', 'cliente3@example.com', 'Pedro Costa', 'failed')
ON CONFLICT (payment_id) DO NOTHING;

-- Inserir alguns logs de exemplo
INSERT INTO api_logs (correlation_id, method, url, ip_address, response_status, response_time_ms) VALUES
('corr_001', 'POST', '/api/v1/payments', '127.0.0.1', 201, 150),
('corr_002', 'GET', '/api/v1/payments/pay_001', '127.0.0.1', 200, 45),
('corr_003', 'POST', '/api/v1/webhooks', '127.0.0.1', 200, 89)
ON CONFLICT DO NOTHING;
`;

async function setupLocalPostgres() {
  const client = new Client(localConfig);
  
  try {
    console.log('📡 Conectando ao PostgreSQL local...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // Criar banco de dados se não existir
    try {
      await client.query('CREATE DATABASE paygator');
      console.log('✅ Banco de dados "paygator" criado!');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('ℹ️  Banco de dados "paygator" já existe');
      } else {
        throw error;
      }
    }
    
    // Conectar ao banco paygator
    await client.end();
    const paygatorClient = new Client({
      ...localConfig,
      database: 'paygator'
    });
    await paygatorClient.connect();
    
    console.log('🔨 Criando tabelas...');
    await paygatorClient.query(createTablesSQL);
    console.log('✅ Tabelas criadas com sucesso!');
    
    console.log('📊 Inserindo dados de exemplo...');
    await paygatorClient.query(sampleDataSQL);
    console.log('✅ Dados de exemplo inseridos!');
    
    // Testar as tabelas
    const tables = ['payments', 'api_logs', 'payment_logs', 'auth_logs'];
    for (const table of tables) {
      const result = await paygatorClient.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`📈 ${table}: ${result.rows[0].count} registros`);
    }
    
    await paygatorClient.end();
    console.log('🎉 PostgreSQL local configurado com sucesso!');
    
    // Criar arquivo .env.local
    const envLocalContent = `# Configuração PostgreSQL Local
NODE_ENV=development
PORT=3000

# PostgreSQL Local
SUPABASE_HOST=localhost
SUPABASE_PORT=5432
SUPABASE_DATABASE=paygator
SUPABASE_USER=postgres
SUPABASE_PASSWORD=postgres123

# Outras configurações
WEBHOOK_SECRET=1a02aa5907a7bc447b392f07548cf2a0f7713be742787327e4c4302c6960ee24
API_KEY=main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e
PLAYFOOD_API_KEY=playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5
JWT_SECRET=default-jwt-secret
SESSION_SECRET=paygator-secret
ADMIN_PASSWORD=admin123

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# CORS
ALLOWED_ORIGINS=http://localhost:3000
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=Content-Type,Authorization,X-API-Key,X-Webhook-Signature
`;
    
    fs.writeFileSync('.env.local', envLocalContent);
    console.log('📝 Arquivo .env.local criado!');
    
    console.log('\n🚀 Para usar PostgreSQL local:');
    console.log('1. Copie .env.local para .env: cp .env.local .env');
    console.log('2. Reinicie o servidor: npm start');
    console.log('3. Teste a conexão: npm run test-db');
    
  } catch (error) {
    console.error('❌ Erro ao configurar PostgreSQL local:', error.message);
    console.log('\n💡 Certifique-se de que:');
    console.log('1. PostgreSQL está instalado e rodando');
    console.log('2. Usuário "postgres" existe com senha "postgres123"');
    console.log('3. Porta 5432 está disponível');
    
    console.log('\n📋 Para instalar PostgreSQL:');
    console.log('Windows: https://www.postgresql.org/download/windows/');
    console.log('macOS: brew install postgresql');
    console.log('Linux: sudo apt-get install postgresql postgresql-contrib');
  }
}

setupLocalPostgres(); 