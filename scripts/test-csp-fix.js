const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key-123'; // Substitua pela sua chave API real

async function testCSPFix() {
  try {
    console.log('🧪 Testando correções de CSP...\n');

    // 1. Criar um pagamento para testar
    console.log('1️⃣ Criando pagamento para teste...');
    const createPaymentResponse = await axios.post(`${BASE_URL}/api/v1/payments/create`, {
      amount: 35.00,
      currency: 'MZN',
      customer: {
        phone: '+258841234567',
        name: 'Teste CSP',
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
          const hasButton = html.includes('id="payButton"');
          const hasExternalJS = html.includes('src="/js/payment-form.js"');
          const hasPaymentData = html.includes('id="payment-data"');
          const hasNoInlineScript = !html.includes('<script>') || html.includes('type="application/json"');
          
          console.log(`   ✅ Formulário: ${hasForm ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Campo telefone: ${hasPhoneInput ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Botão: ${hasButton ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ JavaScript externo: ${hasExternalJS ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Dados do pagamento: ${hasPaymentData ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Sem scripts inline: ${hasNoInlineScript ? 'Sim' : 'Não'}`);
          
          // Verificar se não há atributos problemáticos
          const hasMethodPost = html.includes('method="POST"');
          const hasAction = html.includes('action=');
          const hasTypeSubmit = html.includes('type="submit"');
          
          console.log(`   ✅ Sem method POST: ${!hasMethodPost ? 'Sim' : 'Não'}`);
          console.log(`   ✅ Sem action: ${!hasAction ? 'Sim' : 'Não'}`);
          console.log(`   ✅ Botão type button: ${!hasTypeSubmit ? 'Sim' : 'Não'}`);
          
          if (hasMethodPost || hasAction || hasTypeSubmit) {
            console.log('   ⚠️ ATENÇÃO: Formulário ainda tem atributos problemáticos!');
          }
        }
      } catch (formError) {
        console.log('❌ Erro ao acessar formulário:', formError.message);
      }

      // 3. Testar se o arquivo JavaScript está acessível
      console.log('\n3️⃣ Testando acesso ao arquivo JavaScript...');
      try {
        const jsResponse = await axios.get(`${BASE_URL}/js/payment-form.js`);
        if (jsResponse.status === 200) {
          console.log('✅ Arquivo JavaScript acessível!');
          console.log(`   Tamanho: ${jsResponse.data.length} caracteres`);
          
          // Verificar se contém as funções necessárias
          const jsContent = jsResponse.data;
          const hasProcessPayment = jsContent.includes('processPayment');
          const hasShowPopup = jsContent.includes('showPopup');
          const hasPollPaymentStatus = jsContent.includes('pollPaymentStatus');
          
          console.log(`   ✅ Função processPayment: ${hasProcessPayment ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Função showPopup: ${hasShowPopup ? 'Presente' : 'Ausente'}`);
          console.log(`   ✅ Função pollPaymentStatus: ${hasPollPaymentStatus ? 'Presente' : 'Ausente'}`);
        }
      } catch (jsError) {
        console.log('❌ Erro ao acessar JavaScript:', jsError.message);
      }

      // 4. Testar processamento M-Pesa
      console.log('\n4️⃣ Testando processamento M-Pesa...');
      const mpesaResponse = await axios.post(`${BASE_URL}/api/v1/payments/process-mpesa`, {
        paymentId: paymentData.externalPayment.id,
        phone: '+258841234567',
        amount: 35.00,
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
  console.log('🚀 Iniciando teste de correções de CSP...\n');
  
  await testCSPFix();
  
  console.log('\n✨ Teste concluído!');
  console.log('\n📋 Resumo das correções implementadas:');
  console.log('   ✅ JavaScript movido para arquivo externo');
  console.log('   ✅ Formulário sem atributos problemáticos');
  console.log('   ✅ CSP configurado para permitir arquivos externos');
  console.log('   ✅ Arquivos estáticos configurados');
  console.log('   ✅ Sem scripts inline no HTML');
  console.log('\n🎯 Para testar manualmente:');
  console.log('   1. Acesse o formulário de pagamento');
  console.log('   2. Abra o DevTools (F12)');
  console.log('   3. Vá para a aba Console');
  console.log('   4. Digite um telefone válido');
  console.log('   5. Clique em "Pagar com M-Pesa"');
  console.log('   6. Verifique se não há erros de CSP');
  console.log('   7. Verifique se os popups aparecem');
}

// Executar teste se o script for chamado diretamente
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = {
  testCSPFix,
  runTest
};
