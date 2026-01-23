#!/usr/bin/env node

/**
 * Script para limpar todos os dados do banco de dados PostgreSQL (execução automática)
 * Mantém a estrutura das tabelas, apenas remove os dados
 */

const { Client } = require('pg');
require('dotenv').config();

// Obter configuração do ambiente (mesma lógica do supabase.ts)
const getClientConfig = () => {
  // Tentar DATABASE_URL primeiro
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    };
  }
  
  // Construir a partir das variáveis individuais (mesma lógica do supabase.ts)
  return {
    host: process.env.SUPABASE_HOST || 'db.llrcdfutvjrrccgytbjh.supabase.co',
    port: parseInt(process.env.SUPABASE_PORT || '5432', 10),
    database: process.env.SUPABASE_DATABASE || 'postgres',
    user: process.env.SUPABASE_USER || 'postgres',
    password: process.env.SUPABASE_PASSWORD || '.7K8.PfQWJH@#-d',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  };
};

const clientConfig = getClientConfig();
const client = new Client(clientConfig);

// Lista de todas as tabelas a serem limpas
const tablesToClear = [
  'payments',
  'playfood_orders',
  'playfood_payments',
  'webhook_logs',
  'api_logs',
  'payment_logs',
  'auth_logs'
];

async function clearDatabase() {
  try {
    await client.connect();
    console.log('\n🗑️  Limpando banco de dados...\n');
    console.log('📊 Conexão estabelecida com sucesso\n');

    let totalDeleted = 0;

    for (const table of tablesToClear) {
      try {
        // Verificar se a tabela existe
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);

        if (!tableExists.rows[0].exists) {
          console.log(`   ⚠️  Tabela '${table}' não existe, pulando...`);
          continue;
        }

        // Contar registros antes de deletar
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);

        if (count === 0) {
          console.log(`   ✓ ${table}: 0 registros (já está vazia)`);
          continue;
        }

        // Limpar a tabela usando TRUNCATE (mais rápido que DELETE)
        // CASCADE remove dados de tabelas dependentes também
        await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        
        console.log(`   ✅ ${table}: ${count} registro(s) removido(s)`);
        totalDeleted += count;
      } catch (error) {
        console.error(`   ❌ Erro ao limpar tabela '${table}':`, error.message);
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   Total de registros removidos: ${totalDeleted}`);
    console.log(`   Tabelas processadas: ${tablesToClear.length}`);
    
    // Verificar se todas as tabelas estão vazias
    console.log('\n🔍 Verificando tabelas após limpeza:');
    for (const table of tablesToClear) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        const status = count === 0 ? '✅' : '⚠️';
        console.log(`   ${status} ${table}: ${count} registro(s)`);
      } catch (error) {
        console.log(`   ❌ ${table}: Erro ao verificar`);
      }
    }

    console.log('\n✅ Limpeza concluída com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Erro ao limpar banco de dados:', error.message);
    console.error('\n💡 Verifique se:');
    console.error('   - As variáveis de ambiente estão configuradas corretamente');
    console.error('   - A conexão com o banco de dados está funcionando');
    console.error('   - Você tem permissões para deletar dados\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar automaticamente
clearDatabase();

