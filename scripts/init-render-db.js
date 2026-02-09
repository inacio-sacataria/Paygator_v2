/**
 * Inicializa o schema no PostgreSQL do Render (base grupogo).
 * Usa DATABASE_URL do .env.
 * Uso: node scripts/init-render-db.js
 */
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'init-render.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não definida no .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    console.log('📡 Conectando ao PostgreSQL (Render)...');
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
