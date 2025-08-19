const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key-123'; // Substitua pela sua chave API real

async function testMpesaPayment() {
  try {
    console.log('🧪 Testando sistema de pagamento M-Pesa...\n');

    // 1. Criar um pagamento
    console.log('1️⃣ Criando pagamento...');
    const createPaymentResponse = await axios.post(`${BASE_URL}/api/v1/payments/create`, {
      amount: 50.00,
      currency: 'MZN',
      customer: {
        phone: '+258841234567',
        name: 'João Silva',
        email: 'joao@example.com'
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
      console.log(`   Link interno: ${paymentData.link}`);
      console.log(`   Tipo: ${paymentData.responseType}\n`);

      // 2. Testar formulário de pagamento
      console.log('2️⃣ Testando acesso ao formulário de pagamento...');
      try {
        const formResponse = await axios.get(`${paymentData.link}`);
        if (formResponse.status === 200) {
          console.log('✅ Formulário de pagamento acessível!');
          console.log(`   URL: ${paymentData.link}`);
        }
      } catch (formError) {
        console.log('❌ Erro ao acessar formulário:', formError.message);
      }

      // 3. Processar pagamento M-Pesa
      console.log('\n3️⃣ Processando pagamento M-Pesa...');
      const mpesaResponse = await axios.post(`${BASE_URL}/api/v1/payments/process-mpesa`, {
        paymentId: paymentData.externalPayment.id,
        phone: '+258841234567',
        amount: 50.00,
        currency: 'MZN'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (mpesaResponse.data.success) {
        console.log('✅ Pagamento M-Pesa processado com sucesso!');
        console.log(`   Transaction ID: ${mpesaResponse.data.data.transactionId}`);
        console.log(`   Status: ${mpesaResponse.data.data.status}\n`);

        // 4. Simular callback M-Pesa (sucesso)
        console.log('4️⃣ Simulando callback M-Pesa (sucesso)...');
        const callbackResponse = await axios.post(`${BASE_URL}/api/v1/payments/mpesa-callback`, {
          paymentId: paymentData.externalPayment.id,
          status: 'success',
          transactionId: mpesaResponse.data.data.transactionId
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (callbackResponse.data.success) {
          console.log('✅ Callback M-Pesa processado com sucesso!');
          console.log(`   Status final: ${callbackResponse.data.data.status}`);
        }

        // 5. Verificar status final do pagamento
        console.log('\n5️⃣ Verificando status final do pagamento...');
        const statusResponse = await axios.get(`${BASE_URL}/api/v1/payments/${paymentData.externalPayment.id}/status`, {
          headers: {
            'X-API-Key': API_KEY
          }
        });

        if (statusResponse.status === 200) {
          console.log('✅ Status do pagamento verificado!');
          console.log(`   Status: ${statusResponse.data.status}`);
          console.log(`   Valor: ${statusResponse.data.amount} ${statusResponse.data.currency}`);
        }

      } else {
        console.log('❌ Erro ao processar pagamento M-Pesa:', mpesaResponse.data.message);
      }

    } else {
      console.log('❌ Erro ao criar pagamento:', createPaymentResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
  }
}

async function testMpesaCallbackFailure() {
  try {
    console.log('\n🧪 Testando callback M-Pesa com falha...\n');

    // 1. Criar um pagamento para teste de falha
    console.log('1️⃣ Criando pagamento para teste de falha...');
    const createPaymentResponse = await axios.post(`${BASE_URL}/api/v1/payments/create`, {
      amount: 25.00,
      currency: 'MZN',
      customer: {
        phone: '+258849876543',
        name: 'Maria Santos',
        email: 'maria@example.com'
      },
      returnUrl: 'https://example.com/failure'
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (createPaymentResponse.data.success) {
      const paymentData = createPaymentResponse.data.data;
      console.log('✅ Pagamento criado para teste de falha!');
      console.log(`   ID: ${paymentData.externalPayment.id}\n`);

      // 2. Processar pagamento M-Pesa
      console.log('2️⃣ Processando pagamento M-Pesa...');
      const mpesaResponse = await axios.post(`${BASE_URL}/api/v1/payments/process-mpesa`, {
        paymentId: paymentData.externalPayment.id,
        phone: '+258849876543',
        amount: 25.00,
        currency: 'MZN'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (mpesaResponse.data.success) {
        console.log('✅ Pagamento M-Pesa processado!');

        // 3. Simular callback M-Pesa (falha)
        console.log('\n3️⃣ Simulando callback M-Pesa (falha)...');
        const callbackResponse = await axios.post(`${BASE_URL}/api/v1/payments/mpesa-callback`, {
          paymentId: paymentData.externalPayment.id,
          status: 'failed',
          transactionId: mpesaResponse.data.data.transactionId
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (callbackResponse.data.success) {
          console.log('✅ Callback M-Pesa de falha processado!');
          console.log(`   Status final: ${callbackResponse.data.data.status}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro durante teste de falha:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes do sistema M-Pesa...\n');
  
  await testMpesaPayment();
  await testMpesaCallbackFailure();
  
  console.log('\n✨ Testes concluídos!');
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testMpesaPayment,
  testMpesaCallbackFailure,
  runAllTests
};
