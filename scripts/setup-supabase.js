#!/usr/bin/env node

const { Client } = require('pg');

// PostgreSQL connection string
const connectionString = 'postgresql://postgres:.7K8.PfQWJH%40%23-d@db.llrcdfutvjrrccgytbjh.supabase.co:5432/postgres';

// SQL para criar as tabelas
const createTablesSQL = `
-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    external_payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MT',
    payment_method VARCHAR(50) DEFAULT 'credit_card',
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    customer_city VARCHAR(100),
    customer_country VARCHAR(100),
    vendor_id VARCHAR(255),
    vendor_name VARCHAR(255),
    vendor_email VARCHAR(255),
    vendor_phone VARCHAR(50),
    vendor_address TEXT,
    vendor_city VARCHAR(100),
    vendor_country VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    order_id VARCHAR(255),
    return_url TEXT,
    iframe_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pedidos PlayFood
CREATE TABLE IF NOT EXISTS playfood_orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) UNIQUE NOT NULL,
    external_order_id VARCHAR(255),
    customer_id VARCHAR(255),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MT',
    status VARCHAR(20) DEFAULT 'pending',
    items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pagamentos PlayFood
CREATE TABLE IF NOT EXISTS playfood_payments (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    order_id VARCHAR(255) REFERENCES playfood_orders(order_id),
    external_payment_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MT',
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de webhook
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(255),
    event_type VARCHAR(100),
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    response_status INTEGER,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de logs de API (histórico completo de chamadas)
CREATE TABLE IF NOT EXISTS api_logs (
    id SERIAL PRIMARY KEY,
    correlation_id VARCHAR(255),
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
    service_name VARCHAR(50) DEFAULT 'paygator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de pagamentos (histórico específico de pagamentos)
CREATE TABLE IF NOT EXISTS payment_logs (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(255),
    external_payment_id VARCHAR(255),
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'status_changed', 'failed'
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    amount DECIMAL(10,2),
    currency VARCHAR(3),
    customer_email VARCHAR(255),
    error_message TEXT,
    metadata JSONB,
    correlation_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de autenticação
CREATE TABLE IF NOT EXISTS auth_logs (
    id SERIAL PRIMARY KEY,
    correlation_id VARCHAR(255),
    api_key VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'auth_success', 'auth_failed'
    status VARCHAR(20) NOT NULL, -- 'success', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_playfood_orders_order_id ON playfood_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_playfood_orders_status ON playfood_orders(status);

CREATE INDEX IF NOT EXISTS idx_playfood_payments_payment_id ON playfood_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_playfood_payments_order_id ON playfood_payments(order_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Índices para logs de API
CREATE INDEX IF NOT EXISTS idx_api_logs_correlation_id ON api_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_method ON api_logs(method);
CREATE INDEX IF NOT EXISTS idx_api_logs_url ON api_logs(url);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_response_status ON api_logs(response_status);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_key ON api_logs(api_key);

-- Índices para logs de pagamentos
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_action ON payment_logs(action);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_logs_correlation_id ON payment_logs(correlation_id);

-- Índices para logs de autenticação
CREATE INDEX IF NOT EXISTS idx_auth_logs_api_key ON auth_logs(api_key);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_status ON auth_logs(status);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
`;

async function setupDatabase() {
  const client = new Client({
    host: 'db.llrcdfutvjrrccgytbjh.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '.7K8.PfQWJH@#-d',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando ao Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    console.log('📋 Criando tabelas...');
    await client.query(createTablesSQL);
    console.log('✅ Tabelas criadas com sucesso!');

    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('payments', 'playfood_orders', 'playfood_payments', 'webhook_logs', 'api_logs', 'payment_logs', 'auth_logs')
      ORDER BY table_name;
    `);

    console.log('📊 Tabelas disponíveis:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Inserir dados de teste na tabela payments
    console.log('🧪 Inserindo dados de teste...');
    const testPayment = await client.query(`
      INSERT INTO payments (
        payment_id, 
        external_payment_id, 
        amount, 
        currency, 
        customer_email, 
        customer_name,
        customer_phone,
        customer_address,
        customer_city,
        customer_country,
        vendor_id,
        vendor_name,
        vendor_email,
        vendor_phone,
        vendor_address,
        vendor_city,
        vendor_country,
        status
      ) VALUES (
        'test_payment_001',
        'ext_test_001',
        100.50,
        'MT',
        'test@example.com',
        'Test Customer',
        '+258841234567',
        'Rua das Flores, 123',
        'Maputo',
        'Moçambique',
        'vendor_001',
        'Restaurante Teste',
        'vendor@example.com',
        '+258842345678',
        'Avenida 25 de Setembro, 456',
        'Maputo',
        'Moçambique',
        'pending'
      ) ON CONFLICT (payment_id) DO NOTHING
      RETURNING id, payment_id, amount;
    `);

    if (testPayment.rows.length > 0) {
      console.log('✅ Dados de teste inseridos com sucesso!');
      console.log(`   ID: ${testPayment.rows[0].id}, Payment ID: ${testPayment.rows[0].payment_id}, Amount: ${testPayment.rows[0].amount}`);
    } else {
      console.log('ℹ️  Dados de teste já existem');
    }

    console.log('\n🎉 Configuração do Supabase concluída com sucesso!');
    console.log('   O banco de dados está pronto para uso.');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
    console.error('   Detalhes:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada.');
  }
}

setupDatabase().catch(console.error); 