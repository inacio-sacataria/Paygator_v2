const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key-123';

async function debugMpesaError() {
  try {
    console.log('🔍 Debugando erro 500 do M-Pesa...\n');

    // 1. Criar um pagamento para testar
    console.log('1️⃣ Criando pagamento para teste...');
    const createPaymentResponse = await axios.post(`${BASE_URL}/api/v1/payments/create`, {
      amount: 25.00,
      currency: 'MZN',
      customer: {
        phone: '+258841234567',
        name: 'Teste Debug',
        email: 'teste@example.com'
      },
      returnUrl: 'https://example.com/success'
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (createPaymentResponse.data.success) {
      const paymentData = createPaymentResponse.data.data;
      console.log('✅ Pagamento criado com sucesso!');
      console.log(`   ID: ${paymentData.externalPayment.id}`);
      console.log(`   Link: ${paymentData.link}`);
      console.log(`   Tipo: ${paymentData.responseType}\n`);

      // 2. Verificar se o pagamento existe no banco
      console.log('2️⃣ Verificando pagamento no banco...');
      try {
        const statusResponse = await axios.get(`${BASE_URL}/api/v1/payments/${paymentData.externalPayment.id}/status`);
        console.log('✅ Status do pagamento:', statusResponse.data);
      } catch (statusError) {
        console.log('❌ Erro ao verificar status:', statusError.response?.data || statusError.message);
      }

      // 3. Testar processamento M-Pesa com logs detalhados
      console.log('\n3️⃣ Testando processamento M-Pesa...');
      try {
        const mpesaResponse = await axios.post(`${BASE_URL}/api/v1/payments/process-mpesa`, {
          paymentId: paymentData.externalPayment.id,
          phone: '+258841234567',
          amount: 25.00,
          currency: 'MZN'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Pagamento M-Pesa processado com sucesso!');
        console.log('   Response:', mpesaResponse.data);
      } catch (mpesaError) {
        console.log('❌ Erro ao processar M-Pesa:');
        console.log('   Status:', mpesaError.response?.status);
        console.log('   Data:', mpesaError.response?.data);
        console.log('   Message:', mpesaError.message);
        
        if (mpesaError.response?.status === 500) {
          console.log('\n🔍 Erro 500 detectado! Verificando logs do servidor...');
          console.log('   Verifique o console do servidor para mais detalhes.');
        }
      }

    } else {
      console.log('❌ Erro ao criar pagamento:', createPaymentResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testando conexão com banco de dados...');
  
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Servidor saudável:', healthResponse.data);
  } catch (error) {
    console.log('❌ Erro no health check:', error.message);
  }
}

async function runDebug() {
  console.log('🚀 Iniciando debug do erro M-Pesa...\n');
  
  await testDatabaseConnection();
  await debugMpesaError();
  
  console.log('\n✨ Debug concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Verifique os logs do servidor');
  console.log('   2. Confirme se o banco SQLite está funcionando');
  console.log('   3. Verifique se a tabela payments existe');
  console.log('   4. Teste manualmente no formulário');
}

// Executar debug se o script for chamado diretamente
if (require.main === module) {
  runDebug().catch(console.error);
}

module.exports = {
  debugMpesaError,
  testDatabaseConnection,
  runDebug
};
