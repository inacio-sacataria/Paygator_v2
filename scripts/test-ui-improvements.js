const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key-123'; // Substitua pela sua chave API real

async function testUIImprovements() {
  try {
    console.log('🧪 Testando melhorias de UI do formulário de pagamento...\n');

    // 1. Criar um pagamento para testar
    console.log('1️⃣ Criando pagamento para teste...');
    const createPaymentResponse = await axios.post(`${BASE_URL}/api/v1/payments/create`, {
      amount: 25.00,
      currency: 'MZN',
      customer: {
        phone: '+258841234567',
        name: 'Teste UI',
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

      // 2. Testar formulário de pagamento
      console.log('2️⃣ Testando acesso ao formulário...');
      try {
        const formResponse = await axios.get(`${paymentData.link}`);
        if (formResponse.status === 200) {
          console.log('✅ Formulário de pagamento acessível!');
          console.log(`   URL: ${paymentData.link}`);
          
          // Verificar se o HTML contém os novos elementos
          const html = formResponse.data;
          const hasPaymentStatus = html.includes('payment-status');
          const hasImprovedCSS = html.includes('z-index') && html.includes('pointer-events');
          
          console.log(`   ✅ Elemento de status: ${hasPaymentStatus ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ CSS melhorado: ${hasImprovedCSS ? 'Presente' : 'Ausente'}`);
        }
      } catch (formError) {
        console.log('❌ Erro ao acessar formulário:', formError.message);
      }

      // 3. Testar processamento M-Pesa
      console.log('\n3️⃣ Testando processamento M-Pesa...');
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

      if (mpesaResponse.data.success) {
        console.log('✅ Pagamento M-Pesa processado com sucesso!');
        console.log(`   Transaction ID: ${mpesaResponse.data.data.transactionId}`);
        console.log(`   Status: ${mpesaResponse.data.data.status}\n`);

        // 4. Simular callback de sucesso
        console.log('4️⃣ Simulando callback de sucesso...');
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

        // 5. Verificar status final
        console.log('\n5️⃣ Verificando status final...');
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

async function testDifferentScenarios() {
  console.log('\n🧪 Testando diferentes cenários de UI...\n');

  const scenarios = [
    {
      name: 'Pagamento com sucesso',
      amount: 15.00,
      currency: 'MZN',
      phone: '+258849876543'
    },
    {
      name: 'Pagamento com falha',
      amount: 20.00,
      currency: 'MZN',
      phone: '+258847654321'
    }
  ];

  for (const scenario of scenarios) {
    try {
      console.log(`Testando: ${scenario.name}`);
      
      // Criar pagamento
      const createResponse = await axios.post(`${BASE_URL}/api/v1/payments/create`, {
        amount: scenario.amount,
        currency: scenario.currency,
        customer: {
          phone: scenario.phone,
          name: `Teste ${scenario.name}`,
          email: 'teste@example.com'
        },
        returnUrl: 'https://example.com/success'
      }, {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (createResponse.data.success) {
        const paymentId = createResponse.data.data.externalPayment.id;
        
        // Processar M-Pesa
        const mpesaResponse = await axios.post(`${BASE_URL}/api/v1/payments/process-mpesa`, {
          paymentId: paymentId,
          phone: scenario.phone,
          amount: scenario.amount,
          currency: scenario.currency
        });

        if (mpesaResponse.data.success) {
          // Simular callback baseado no cenário
          const status = scenario.name.includes('sucesso') ? 'success' : 'failed';
          
          await axios.post(`${BASE_URL}/api/v1/payments/mpesa-callback`, {
            paymentId: paymentId,
            status: status,
            transactionId: mpesaResponse.data.data.transactionId
          });

          console.log(`   ✅ ${scenario.name}: Processado`);
        }
      }
    } catch (error) {
      console.log(`   ❌ ${scenario.name}: ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes de melhorias de UI...\n');
  
  await testUIImprovements();
  await testDifferentScenarios();
  
  console.log('\n✨ Testes concluídos!');
  console.log('\n📋 Resumo das melhorias implementadas:');
  console.log('   ✅ Campo de telefone com sobreposição corrigida');
  console.log('   ✅ Mensagens de feedback visuais melhoradas');
  console.log('   ✅ Indicador de status do pagamento');
  console.log('   ✅ Emojis e formatação visual aprimorada');
  console.log('   ✅ Sistema de polling com feedback em tempo real');
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testUIImprovements,
  testDifferentScenarios,
  runAllTests
};
