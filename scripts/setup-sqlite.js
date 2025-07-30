const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando SQLite para o Paygator...\n');

try {
  // Instalar dependências do SQLite
  console.log('📦 Instalando dependências do SQLite...');
  execSync('npm install sqlite3 @types/sqlite3', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas com sucesso!\n');

  // Criar diretório data se não existir
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Diretório data criado:', dataDir);
  }

  // Testar conexão com SQLite
  console.log('🔍 Testando conexão com SQLite...');
  
  const { connectSQLite, disconnectSQLite, getSQLiteStatus } = require('../dist/config/sqlite');
  
  async function testSQLite() {
    try {
      await connectSQLite();
      const status = getSQLiteStatus();
      console.log('✅ SQLite conectado com sucesso!');
      console.log('📍 Caminho do banco:', status.path);
      
      // Testar operações básicas
      const { sqliteService } = require('../dist/services/sqliteService');
      
      // Criar um webhook de teste
      const webhookId = await sqliteService.createWebhook({
        url: 'https://example.com/webhook',
        provider: 'test',
        is_active: true
      });
      console.log('✅ Webhook de teste criado (ID:', webhookId, ')');
      
             // Criar um pagamento de teste
       const paymentId = await sqliteService.createPayment({
         payment_id: `pay_test_${Date.now()}`,
         provider: 'test',
         amount: 1000,
         status: 'approved'
       });
       console.log('✅ Pagamento de teste criado (ID:', paymentId, ')');
      
             // Criar um pedido de teste
       const orderId = await sqliteService.createPlayfoodOrder({
         order_id: `order_test_${Date.now()}`,
         total_amount: 1500,
         status: 'pending'
       });
       console.log('✅ Pedido de teste criado (ID:', orderId, ')');
      
      // Buscar estatísticas
      const stats = await sqliteService.getStatistics();
      console.log('📊 Estatísticas do banco:');
      console.log('   - Total de pagamentos:', stats.totalPayments);
      console.log('   - Total de pedidos:', stats.totalOrders);
      console.log('   - Total de webhooks:', stats.totalWebhooks);
      console.log('   - Total de logs:', stats.totalLogs);
      
      await disconnectSQLite();
      console.log('\n🎉 Teste do SQLite concluído com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao testar SQLite:', error.message);
      process.exit(1);
    }
  }
  
  testSQLite();
  
} catch (error) {
  console.error('❌ Erro durante a configuração:', error.message);
  process.exit(1);
} 