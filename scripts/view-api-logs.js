/**
 * Script para visualizar logs de requisições da API do banco de dados
 * Uso: node scripts/view-api-logs.js [--limit 50] [--method GET] [--status 200] [--url /api/...]
 */

const { Client } = require('pg');
require('dotenv').config();

const args = process.argv.slice(2);
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) || 50 : 50;
const method = args.includes('--method') ? args[args.indexOf('--method') + 1] : null;
const status = args.includes('--status') ? parseInt(args[args.indexOf('--status') + 1]) : null;
const url = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;

const client = new Client({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.SUPABASE_USER}:${process.env.SUPABASE_PASSWORD}@${process.env.SUPABASE_HOST}:${process.env.SUPABASE_PORT || 5432}/${process.env.SUPABASE_DATABASE}`,
});

async function viewLogs() {
  try {
    await client.connect();
    console.log('\n📋 Logs de Requisições da API - Paygator');
    console.log('==========================================\n');

    let query = `
      SELECT 
        correlation_id,
        method,
        url,
        ip_address,
        response_status,
        response_time_ms,
        error_message,
        created_at
      FROM api_logs
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (method) {
      query += ` AND method = $${paramIndex}`;
      params.push(method);
      paramIndex++;
    }

    if (status) {
      query += ` AND response_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (url) {
      query += ` AND url LIKE $${paramIndex}`;
      params.push(`%${url}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      console.log('⚠️  Nenhum log encontrado.\n');
      return;
    }

    console.log(`📊 Mostrando ${result.rows.length} requisições mais recentes:\n`);

    result.rows.forEach((row, index) => {
      const statusColor = row.response_status >= 400 ? '\x1b[31m' : row.response_status >= 300 ? '\x1b[33m' : '\x1b[32m';
      const resetColor = '\x1b[0m';
      
      console.log(`${index + 1}. ${statusColor}${row.method}${resetColor} ${row.url}`);
      console.log(`   Status: ${statusColor}${row.response_status}${resetColor} | Tempo: ${row.response_time_ms}ms | IP: ${row.ip_address || 'N/A'}`);
      console.log(`   Correlation ID: ${row.correlation_id}`);
      if (row.error_message) {
        console.log(`   ❌ Erro: ${row.error_message.substring(0, 100)}...`);
      }
      console.log(`   Data: ${new Date(row.created_at).toLocaleString()}`);
      console.log('');
    });

    console.log('✅ Fim dos logs\n');
  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error.message);
    console.error('\n💡 Verifique se:');
    console.error('   - O banco de dados está configurado corretamente');
    console.error('   - As variáveis de ambiente estão definidas');
    console.error('   - A tabela api_logs existe no banco de dados\n');
  } finally {
    await client.end();
  }
}

viewLogs();

