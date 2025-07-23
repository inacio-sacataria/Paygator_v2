#!/usr/bin/env node

const { Client } = require('pg');

// PostgreSQL connection string
const connectionString = 'postgresql://postgres:.7K8.PfQWJH%40%23-d@db.llrcdfutvjrrccgytbjh.supabase.co:5432/postgres';

// SQL para adicionar as novas colunas
const addColumnsSQL = `
-- Adicionar colunas de cliente
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_city VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_country VARCHAR(100);

-- Adicionar colunas de vendor
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vendor_email VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vendor_phone VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vendor_address TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vendor_city VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vendor_country VARCHAR(100);

-- Atualizar moeda padrão para MT
UPDATE payments SET currency = 'MT' WHERE currency = 'BRL';
`;

async function addColumns() {
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

    console.log('📋 Adicionando novas colunas...');
    await client.query(addColumnsSQL);
    console.log('✅ Colunas adicionadas com sucesso!');

    // Verificar a estrutura da tabela
    console.log('🔍 Verificando estrutura da tabela payments...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position;
    `);

    console.log('📊 Estrutura da tabela payments:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('\n🎉 Atualização concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error.message);
    console.error('   Detalhes:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada.');
  }
}

addColumns().catch(console.error); 