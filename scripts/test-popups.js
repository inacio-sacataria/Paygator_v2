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

async function testPopups() {
  try {
    console.log('🧪 Testando sistema de popups...\n');

    // 1. Criar pagamento
    console.log('1️⃣ Criando pagamento para teste...');
    const createResponse = await makeRequest('POST', '/api/v1/payments/create', {
      amount: 30.00,
      currency: 'MZN',
      customer: {
        phone: '+258841234567',
        name: 'Teste Popups',
        email: 'teste@example.com'
      },
      returnUrl: 'https://example.com/success'
    });

    if (createResponse.status === 201 && createResponse.data.success) {
      const paymentId = createResponse.data.data.externalPayment.id;
      console.log('✅ Pagamento criado! ID:', paymentId);

      // 2. Acessar formulário
      console.log('\n2️⃣ Acessando formulário de pagamento...');
      const formResponse = await makeRequest('GET', `/payment-form/${paymentId}`);
      
      if (formResponse.status === 200) {
        console.log('✅ Formulário acessível!');
        
        // Verificar se contém elementos de popup
        const html = formResponse.data;
        const hasPopupOverlay = html.includes('id="popupOverlay"');
        const hasPopup = html.includes('id="popup"');
        const hasPopupIcon = html.includes('id="popupIcon"');
        const hasPopupTitle = html.includes('id="popupTitle"');
        const hasPopupMessage = html.includes('id="popupMessage"');
        const hasPopupButton = html.includes('id="popupButton"');
        const hasPopupClose = html.includes('id="popupClose"');
        
        console.log('   ✅ Popup Overlay:', hasPopupOverlay ? 'Presente' : 'Ausente');
        console.log('   ✅ Popup:', hasPopup ? 'Presente' : 'Ausente');
        console.log('   ✅ Popup Icon:', hasPopupIcon ? 'Presente' : 'Ausente');
        console.log('   ✅ Popup Title:', hasPopupTitle ? 'Presente' : 'Ausente');
        console.log('   ✅ Popup Message:', hasPopupMessage ? 'Presente' : 'Ausente');
        console.log('   ✅ Popup Button:', hasPopupButton ? 'Presente' : 'Ausente');
        console.log('   ✅ Popup Close:', hasPopupClose ? 'Presente' : 'Ausente');
        
        // Verificar se contém JavaScript externo
        const hasExternalJS = html.includes('src="/js/payment-form.js"');
        const hasPaymentData = html.includes('id="payment-data"');
        
        console.log('   ✅ JavaScript Externo:', hasExternalJS ? 'Presente' : 'Ausente');
        console.log('   ✅ Dados do Pagamento:', hasPaymentData ? 'Presente' : 'Ausente');
        
        if (!hasPopupOverlay || !hasPopup) {
          console.log('\n❌ PROBLEMA: Elementos de popup não encontrados no HTML!');
        }
        
        if (!hasExternalJS) {
          console.log('\n❌ PROBLEMA: JavaScript externo não referenciado!');
        }
        
      } else {
        console.log('❌ Erro ao acessar formulário:', formResponse.status);
      }

      // 3. Testar M-Pesa
      console.log('\n3️⃣ Testando processamento M-Pesa...');
      const mpesaResponse = await makeRequest('POST', '/api/v1/payments/process-mpesa', {
        paymentId: paymentId,
        phone: '+258841234567',
        amount: 30.00,
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

// Aguardar servidor iniciar
setTimeout(() => {
  testPopups();
}, 2000);
