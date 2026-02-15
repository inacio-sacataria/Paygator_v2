require('dotenv').config();
const { Client } = require('pg');

async function testDatabaseConnection() {
  console.log('🧪 Testando conexão com o banco de dados...');

  const databaseUrl = process.env.DATABASE_URL;
  const client = new Client(
    databaseUrl
      ? {
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 15000,
        }
      : {
          host: process.env.SUPABASE_HOST || 'db.rpngvbwrrewforclansy.supabase.co',
          port: parseInt(process.env.SUPABASE_PORT || '5432', 10),
          database: process.env.SUPABASE_DATABASE || 'postgres',
          user: process.env.SUPABASE_USER || 'postgres',
          password: process.env.SUPABASE_PASSWORD || '',
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 15000,
        }
  );

  try {
    console.log('📡 Tentando conectar...');
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Hora atual do servidor:', result.rows[0].current_time);
    
    // Testar tabela de logs
    try {
      const logsResult = await client.query('SELECT COUNT(*) as total FROM api_logs');
      console.log('📊 Total de logs de API:', logsResult.rows[0].total);
    } catch (error) {
      console.log('⚠️  Tabela api_logs não encontrada:', error.message);
    }
    
    // Testar tabela de pagamentos
    try {
      const paymentsResult = await client.query('SELECT COUNT(*) as total FROM payments');
      console.log('💰 Total de pagamentos:', paymentsResult.rows[0].total);
    } catch (error) {
      console.log('⚠️  Tabela payments não encontrada:', error.message);
    }
    
    await client.end();
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('🔍 Detalhes do erro:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });

    if (error.code === 'EHOSTUNREACH' && String(error.address || '').includes(':')) {
      console.log('\n💡 Erro IPv6 (rede inacessível). Usa o Connection pooler do Supabase (IPv4):');
      console.log('   1. Dashboard Supabase → Project Settings → Database');
      console.log('   2. Em "Connection string" escolhe "Session mode" (pooler)');
      console.log('   3. Copia a URI e define DATABASE_URL no .env com essa URI');
      console.log('   Ex.: postgresql://postgres.REF:PASSWORD@aws-0-XX.pooler.supabase.com:5432/postgres');
    } else {
      console.log('\n💡 Sugestões:');
      console.log('1. Verifique SUPABASE_PASSWORD ou DATABASE_URL no .env');
      console.log('2. Supabase: usa a connection string "Session mode" (pooler) para IPv4');
      console.log('3. Firewall/rede: verifique se o porto 5432 está acessível');
    }
    process.exit(1);
  }
}

// Executar o teste
testDatabaseConnection(); 