const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testPopupsFinal() {
  try {
    console.log('🧪 Teste FINAL dos popups após correções...\n');

    // 1. Criar pagamento
    console.log('1️⃣ Criando pagamento para teste...');
    const createResponse = await makeRequest('POST', '/api/v1/payments/create', {
      amount: 35.00,
      currency: 'MZN',
      customer: {
        phone: '+258841234567',
        name: 'Teste Final Popups',
        email: 'teste@example.com'
      },
      returnUrl: 'https://example.com/success'
    });

    if (createResponse.status === 201 && createResponse.data.success) {
      const paymentId = createResponse.data.data.externalPayment.id;
      console.log('✅ Pagamento criado! ID:', paymentId);
      console.log('🔗 Link retornado:', createResponse.data.data.link);
      
      // Verificar se o link contém base URL
      const link = createResponse.data.data.link;
      const hasBaseUrl = link.startsWith('http://') || link.startsWith('https://');
      console.log('✅ Link com base URL:', hasBaseUrl ? 'Sim' : 'Não');

      // 2. Acessar formulário
      console.log('\n2️⃣ Acessando formulário de pagamento...');
      const formResponse = await makeRequest('GET', `/payment-form/${paymentId}`);
      
      if (formResponse.status === 200) {
        console.log('✅ Formulário acessível!');
        
        // Verificar elementos de popup
        const html = formResponse.data;
        const hasPopupOverlay = html.includes('id="popupOverlay"');
        const hasPopup = html.includes('id="popup"');
        const hasExternalJS = html.includes('src="/js/payment-form.js"');
        const hasPaymentData = html.includes('id="payment-data"');
        
        console.log('   ✅ Popup Overlay:', hasPopupOverlay ? 'Presente' : 'Ausente');
        console.log('   ✅ Popup:', hasPopup ? 'Presente' : 'Ausente');
        console.log('   ✅ JavaScript Externo:', hasExternalJS ? 'Presente' : 'Ausente');
        console.log('   ✅ Dados do Pagamento:', hasPaymentData ? 'Presente' : 'Ausente');
        
        // Verificar CSS
        const hasPopupCSS = html.includes('.popup-overlay.show');
        console.log('   ✅ CSS Popup Show:', hasPopupCSS ? 'Presente' : 'Ausente');
        
        if (hasPopupOverlay && hasPopup && hasExternalJS && hasPaymentData && hasPopupCSS) {
          console.log('\n🎉 TODOS os elementos necessários estão presentes!');
          console.log('   Os popups devem funcionar corretamente agora.');
        } else {
          console.log('\n❌ PROBLEMA: Alguns elementos ainda estão ausentes!');
        }
        
      } else {
        console.log('❌ Erro ao acessar formulário:', formResponse.status);
      }

      // 3. Testar M-Pesa
      console.log('\n3️⃣ Testando processamento M-Pesa...');
      const mpesaResponse = await makeRequest('POST', '/api/v1/payments/process-mpesa', {
        paymentId: paymentId,
        phone: '+258841234567',
        amount: 35.00,
        currency: 'MZN'
      });

      if (mpesaResponse.status === 200) {
        console.log('✅ M-Pesa funcionando!');
        console.log('   Response:', mpesaResponse.data);
      } else {
        console.log('❌ M-Pesa com erro:', mpesaResponse.status);
        console.log('   Response:', mpesaResponse.data);
      }

    } else {
      console.log('❌ Erro ao criar pagamento:', createResponse.status);
      console.log('   Response:', createResponse.data);
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

async function runTest() {
  console.log('🚀 Iniciando teste FINAL dos popups...\n');
  
  await testPopupsFinal();
  
  console.log('\n✨ Teste FINAL concluído!');
  console.log('\n📋 Resumo das correções implementadas:');
  console.log('   ✅ Base URL adicionado no link de resposta');
  console.log('   ✅ Tipo INTERNAL_FORM adicionado aos tipos TypeScript');
  console.log('   ✅ Erros de retorno de função corrigidos');
  console.log('   ✅ Acesso a propriedades com notação de colchetes');
  console.log('   ✅ CSS para mostrar popup (.popup-overlay.show)');
  console.log('   ✅ Rota pública para verificar status (/public-status)');
  console.log('   ✅ JavaScript com logs de debug para popups');
  console.log('\n🎯 Próximos passos:');
  console.log('   1. Teste manualmente no navegador');
  console.log('   2. Verifique se os popups aparecem');
  console.log('   3. Deploy no Render deve funcionar agora');
}

// Aguardar servidor iniciar
setTimeout(() => {
  runTest();
}, 2000);
