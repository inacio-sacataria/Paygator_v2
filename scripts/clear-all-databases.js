#!/usr/bin/env node

/**
 * Script para limpar todos os dados de TODOS os bancos de dados
 * - PostgreSQL (Supabase)
 * - SQLite
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function clearAllDatabases() {
  console.log('\n🗑️  Limpando TODOS os bancos de dados...\n');
  console.log('=' .repeat(50));
  
  // 1. Limpar SQLite
  console.log('\n📦 1. Limpando SQLite...');
  console.log('-'.repeat(50));
  try {
    const { stdout, stderr } = await execAsync('node scripts/clear-sqlite.js');
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('   ❌ Erro ao limpar SQLite:', error.message);
  }

  // 2. Limpar PostgreSQL
  console.log('\n🐘 2. Limpando PostgreSQL (Supabase)...');
  console.log('-'.repeat(50));
  try {
    const { stdout, stderr } = await execAsync('node scripts/clear-database-auto.js');
    console.log(stdout);
    if (stderr && !stderr.includes('ENOTFOUND')) {
      console.error(stderr);
    }
  } catch (error) {
    if (error.message.includes('ENOTFOUND')) {
      console.log('   ⚠️  Problema de conexão com PostgreSQL.');
      console.log('   💡 Use o script SQL diretamente no Supabase SQL Editor:');
      console.log('      scripts/clear-database.sql\n');
    } else {
      console.error('   ❌ Erro ao limpar PostgreSQL:', error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Processo de limpeza concluído!\n');
}

// Executar
clearAllDatabases();

