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
    currency VARCHAR(3) DEFAULT 'BRL',
    payment_method VARCHAR(50) DEFAULT 'credit_card',
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
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
    currency VARCHAR(3) DEFAULT 'BRL',
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
    currency VARCHAR(3) DEFAULT 'BRL',
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
      AND table_name IN ('payments', 'playfood_orders', 'playfood_payments', 'webhook_logs')
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
        status
      ) VALUES (
        'test_payment_001',
        'ext_test_001',
        100.50,
        'BRL',
        'test@example.com',
        'Test Customer',
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