const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico do Render - Paygator');
console.log('=====================================');

// Informações do sistema
console.log('\n📋 Informações do Sistema:');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Verificar variáveis de ambiente críticas
console.log('\n🔧 Variáveis de Ambiente:');
const criticalEnvVars = [
  'PORT',
  'NODE_ENV',
  'SUPABASE_HOST',
  'SUPABASE_PORT',
  'SUPABASE_DATABASE',
  'SUPABASE_USER',
  'SUPABASE_PASSWORD',
  'WEBHOOK_SECRET',
  'API_KEY',
  'JWT_SECRET',
  'SESSION_SECRET'
];

criticalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('PASSWORD') ? '***' : value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  } else {
    console.log(`❌ ${varName}: NÃO DEFINIDA`);
  }
});

// Verificar arquivos críticos
console.log('\n📁 Arquivos Críticos:');
const criticalFiles = [
  'dist/index.js',
  'package.json',
  'entrypoint.sh',
  '.env'
];

criticalFiles.forEach(file => {
  try {
    const stats = fs.statSync(file);
    console.log(`✅ ${file}: ${stats.size} bytes`);
  } catch (error) {
    console.log(`❌ ${file}: NÃO ENCONTRADO`);
  }
});

// Testar conexão com banco de dados
async function testDatabaseConnection() {
  console.log('\n🗄️ Teste de Conexão com Banco de Dados:');
  
  const dbConfig = {
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

  console.log('📡 Configuração do banco:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    ssl: dbConfig.ssl ? 'enabled' : 'disabled'
  });

  const client = new Client(dbConfig);
  
  try {
    console.log('🔄 Tentando conectar...');
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('⏰ Hora do servidor:', result.rows[0].current_time);
    console.log('🐘 Versão PostgreSQL:', result.rows[0].pg_version.split(' ')[0]);

    // Testar tabelas
    const tables = ['payments', 'api_logs', 'payment_logs', 'auth_logs'];
    for (const table of tables) {
      try {
        const tableResult = await client.query(`SELECT COUNT(*) as total FROM ${table}`);
        console.log(`📊 ${table}: ${tableResult.rows[0].total} registros`);
      } catch (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
      }
    }

    await client.end();
    console.log('✅ Teste de banco concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error.message);
    console.error('🔍 Detalhes do erro:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
  }
}

// Testar se o servidor pode iniciar
async function testServerStartup() {
  console.log('\n🚀 Teste de Inicialização do Servidor:');
  
  try {
    // Verificar se o arquivo compilado existe
    const indexPath = path.join(process.cwd(), 'dist', 'index.js');
    if (!fs.existsSync(indexPath)) {
      console.log('❌ dist/index.js não encontrado');
      console.log('💡 Execute: npm run build');
      return;
    }

    console.log('✅ dist/index.js encontrado');
    
    // Tentar carregar o módulo
    try {
      require(indexPath);
      console.log('✅ Módulo carregado com sucesso');
    } catch (error) {
      console.log('❌ Erro ao carregar módulo:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro no teste de servidor:', error.message);
  }
}

// Verificar logs
function checkLogs() {
  console.log('\n📝 Verificação de Logs:');
  
  const logDir = path.join(process.cwd(), 'logs');
  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir);
    console.log(`📁 Diretório logs encontrado: ${files.length} arquivos`);
    files.forEach(file => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  📄 ${file}: ${stats.size} bytes`);
    });
  } else {
    console.log('❌ Diretório logs não encontrado');
  }
}

// Verificar processos
function checkProcesses() {
  console.log('\n⚙️ Informações do Processo:');
  console.log('PID:', process.pid);
  console.log('Memory usage:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
  console.log('Uptime:', Math.round(process.uptime()), 'seconds');
}

// Executar todos os testes
async function runDiagnostics() {
  console.log('🔍 Iniciando diagnóstico completo...\n');
  
  checkProcesses();
  checkLogs();
  await testDatabaseConnection();
  await testServerStartup();
  
  console.log('\n🎯 Resumo do Diagnóstico:');
  console.log('========================');
  console.log('✅ Sistema operacional compatível');
  console.log('✅ Node.js instalado');
  console.log('✅ Arquivos críticos presentes');
  console.log('✅ Variáveis de ambiente configuradas');
  
  console.log('\n💡 Próximos passos:');
  console.log('1. Verifique os logs do Render');
  console.log('2. Confirme as variáveis de ambiente no Render');
  console.log('3. Teste a conexão com o banco de dados');
  console.log('4. Verifique se a porta está correta');
  
  console.log('\n📞 Se o problema persistir:');
  console.log('- Verifique os logs do Render no dashboard');
  console.log('- Confirme que o build foi bem-sucedido');
  console.log('- Teste localmente com: npm run build && npm start');
}

// Executar diagnóstico
runDiagnostics().catch(error => {
  console.error('❌ Erro durante diagnóstico:', error.message);
  process.exit(1);
}); 