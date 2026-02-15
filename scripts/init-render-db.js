/**
 * Inicializa o schema no PostgreSQL (Render ou Supabase).
 * Usa DATABASE_URL ou SUPABASE_HOST/PORT/DATABASE/USER/PASSWORD do .env.
 * Uso: node scripts/init-render-db.js
 */
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'init-render.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

function getPgConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    };
  }
  const host = process.env.SUPABASE_HOST || process.env.PGHOST;
  const password = process.env.SUPABASE_PASSWORD || process.env.PGPASSWORD;
  if (host && password) {
    return {
      host,
      port: parseInt(process.env.SUPABASE_PORT || process.env.PGPORT || '5432', 10),
      database: process.env.SUPABASE_DATABASE || 'postgres',
      user: process.env.SUPABASE_USER || 'postgres',
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    };
  }
  return null;
}

async function main() {
  const config = getPgConfig();
  if (!config) {
    console.error('❌ Define DATABASE_URL ou SUPABASE_HOST + SUPABASE_PASSWORD no .env');
    process.exit(1);
  }

  const client = new Client(config);

  try {
    console.log('📡 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado. A executar schema...');
    await client.query(sql);
    console.log('✅ Schema aplicado com sucesso.');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
