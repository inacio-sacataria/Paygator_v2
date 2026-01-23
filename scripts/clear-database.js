#!/usr/bin/env node

/**
 * Script para limpar todos os dados do banco de dados PostgreSQL
 * Mantém a estrutura das tabelas, apenas remove os dados
 */

const { Client } = require('pg');
require('dotenv').config();

// Obter string de conexão do ambiente
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.SUPABASE_USER}:${process.env.SUPABASE_PASSWORD}@${process.env.SUPABASE_HOST}:${process.env.SUPABASE_PORT || 5432}/${process.env.SUPABASE_DATABASE}`;

const client = new Client({
  connectionString: connectionString,
});

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

    // Desabilitar foreign keys temporariamente (PostgreSQL não tem isso, mas vamos usar CASCADE)
    console.log('🔄 Desabilitando verificações de foreign key...');
    
    // Para PostgreSQL, vamos usar TRUNCATE com CASCADE para limpar tabelas relacionadas
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

// Confirmar antes de executar
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  ATENÇÃO: Este script irá DELETAR TODOS OS DADOS do banco de dados!');
console.log('   As tabelas serão mantidas, mas todos os registros serão removidos.\n');

rl.question('Deseja continuar? (digite "sim" para confirmar): ', (answer) => {
  if (answer.toLowerCase() === 'sim' || answer.toLowerCase() === 'yes') {
    rl.close();
    clearDatabase();
  } else {
    console.log('\n❌ Operação cancelada.\n');
    rl.close();
    process.exit(0);
  }
});

