const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key-123'; // Substitua pela sua chave API real

async function testFormSubmission() {
  try {
    console.log('🧪 Testando submissão do formulário...\n');

    // 1. Criar um pagamento para testar
    console.log('1️⃣ Criando pagamento para teste...');
    const createPaymentResponse = await axios.post(`${BASE_URL}/api/v1/payments/create`, {
      amount: 25.00,
      currency: 'MZN',
      customer: {
        phone: '+258841234567',
        name: 'Teste Formulário',
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
          
          // Verificar se o HTML contém os elementos necessários
          const html = formResponse.data;
          const hasForm = html.includes('id="paymentForm"');
          const hasPhoneInput = html.includes('id="phone"');
          const hasSubmitButton = html.includes('type="submit"');
          const hasMethodPost = html.includes('method="POST"');
          const hasAction = html.includes('action="javascript:void(0);"');
          
          console.log(`   ✅ Formulário: ${hasForm ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Campo telefone: ${hasPhoneInput ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Botão submit: ${hasSubmitButton ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Method POST: ${hasMethodPost ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Action correto: ${hasAction ? 'Presente' : 'Ausente'}`);
          
          // Verificar se há JavaScript para prevenir submissão padrão
          const hasPreventDefault = html.includes('e.preventDefault()');
          const hasFetchCall = html.includes('fetch(\'/api/v1/payments/process-mpesa\'');
          
          console.log(`   ✅ preventDefault: ${hasPreventDefault ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Fetch call: ${hasFetchCall ? 'Presente' : 'Ausente'}`);
          
          if (!hasPreventDefault) {
            console.log('   ⚠️ ATENÇÃO: preventDefault() não encontrado!');
          }
          if (!hasFetchCall) {
            console.log('   ⚠️ ATENÇÃO: Fetch call não encontrado!');
          }
        }
      } catch (formError) {
        console.log('❌ Erro ao acessar formulário:', formError.message);
      }

      // 3. Testar processamento M-Pesa diretamente
      console.log('\n3️⃣ Testando processamento M-Pesa diretamente...');
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
        console.log(`   Status: ${mpesaResponse.data.data.status}`);
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

async function runTest() {
  console.log('🚀 Iniciando teste de submissão do formulário...\n');
  
  await testFormSubmission();
  
  console.log('\n✨ Teste concluído!');
  console.log('\n🔍 Para debugar o problema:');
  console.log('   1. Abra o DevTools (F12)');
  console.log('   2. Vá para a aba Console');
  console.log('   3. Acesse o formulário de pagamento');
  console.log('   4. Digite um telefone válido');
  console.log('   5. Clique em "Pagar com M-Pesa"');
  console.log('   6. Verifique os logs no console');
  console.log('   7. Verifique se há erros JavaScript');
}

// Executar teste se o script for chamado diretamente
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = {
  testFormSubmission,
  runTest
};
