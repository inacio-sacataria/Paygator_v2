#!/usr/bin/env node

/**
 * Script para limpar todos os dados do banco de dados SQLite
 * Mantém a estrutura das tabelas, apenas remove os dados
 */

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// Caminho do banco SQLite (mesma lógica do sqlite.ts)
const DB_PATH = path.join(process.cwd(), 'data', 'paygator.db');

// Lista de todas as tabelas a serem limpas
const tablesToClear = [
  'payments',
  'playfood_orders',
  'webhook_logs',
  'webhooks',
  'admin_sessions'
];

async function clearSQLite() {
  let db = null;
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(DB_PATH)) {
      console.log(`\n⚠️  Arquivo do banco SQLite não encontrado: ${DB_PATH}`);
      console.log('   O banco será criado quando necessário.\n');
      return;
    }

    console.log('\n🗑️  Limpando banco de dados SQLite...\n');
    console.log(`📁 Caminho: ${DB_PATH}\n`);

    // Abrir conexão com SQLite
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // Habilitar foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

    let totalDeleted = 0;

    for (const table of tablesToClear) {
      try {
        // Verificar se a tabela existe
        const tableExists = await db.get(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [table]
        );

        if (!tableExists) {
          console.log(`   ⚠️  Tabela '${table}' não existe, pulando...`);
          continue;
        }

        // Contar registros antes de deletar
        const countResult = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countResult.count || 0;

        if (count === 0) {
          console.log(`   ✓ ${table}: 0 registros (já está vazia)`);
          continue;
        }

        // Limpar a tabela usando DELETE (SQLite não tem TRUNCATE)
        // DELETE FROM é mais seguro que DROP TABLE pois mantém a estrutura
        await db.run(`DELETE FROM ${table}`);
        
        // Resetar o autoincrement (equivalente ao RESTART IDENTITY)
        await db.run(`DELETE FROM sqlite_sequence WHERE name='${table}'`);
        
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
        const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result?.count || 0;
        const status = count === 0 ? '✅' : '⚠️';
        console.log(`   ${status} ${table}: ${count} registro(s)`);
      } catch (error) {
        console.log(`   ❌ ${table}: Erro ao verificar`);
      }
    }

    console.log('\n✅ Limpeza do SQLite concluída com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Erro ao limpar banco SQLite:', error.message);
    console.error('\n💡 Verifique se:');
    console.error('   - O arquivo do banco existe e está acessível');
    console.error('   - Você tem permissões para modificar o arquivo');
    console.error('   - O banco não está sendo usado por outro processo\n');
    process.exit(1);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

// Executar automaticamente
clearSQLite();

