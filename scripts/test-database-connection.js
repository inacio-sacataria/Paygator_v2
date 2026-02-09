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
          host: process.env.SUPABASE_HOST || 'db.llrcdfutvjrrccgytbjh.supabase.co',
          port: parseInt(process.env.SUPABASE_PORT || '5432', 10),
          database: process.env.SUPABASE_DATABASE || 'postgres',
          user: process.env.SUPABASE_USER || 'postgres',
          password: process.env.SUPABASE_PASSWORD || '.7K8.PfQWJH@#-d',
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
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
    
    // Sugestões de solução
    console.log('\n💡 Sugestões para resolver:');
    console.log('1. Verifique se as variáveis de ambiente estão configuradas corretamente');
    console.log('2. Verifique se o host do Supabase está acessível');
    console.log('3. Verifique se as credenciais estão corretas');
    console.log('4. Verifique se há firewall bloqueando a conexão');
    console.log('5. Tente usar uma VPN se estiver em rede corporativa');
    
    process.exit(1);
  }
}

// Executar o teste
testDatabaseConnection(); 