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
        resolve({ status: res.statusCode, data: body });
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

async function debugPopups() {
  try {
    console.log('🔍 Debugando sistema de popups...\n');

    // 1. Criar pagamento
    console.log('1️⃣ Criando pagamento...');
    const createResponse = await makeRequest('POST', '/api/v1/payments/create', {
      amount: 25.00,
      currency: 'MZN',
      customer: {
        phone: '+258841234567',
        name: 'Debug Popups',
        email: 'debug@example.com'
      },
      returnUrl: 'https://example.com/success'
    });

    console.log('Status:', createResponse.status);
    
    if (createResponse.status === 201) {
      const responseData = JSON.parse(createResponse.data);
      if (responseData.success) {
        const paymentId = responseData.data.externalPayment.id;
        console.log('✅ Pagamento criado! ID:', paymentId);

        // 2. Verificar formulário
        console.log('\n2️⃣ Verificando formulário...');
        const formResponse = await makeRequest('GET', `/payment-form/${paymentId}`);
        
        if (formResponse.status === 200) {
          console.log('✅ Formulário acessível!');
          
          // Verificar elementos de popup
          const html = formResponse.data;
          
          // Elementos HTML
          const elements = [
            'id="popupOverlay"',
            'id="popup"',
            'id="popupIcon"',
            'id="popupTitle"',
            'id="popupMessage"',
            'id="popupButton"',
            'id="popupClose"'
          ];
          
          console.log('\n📋 Verificação de elementos HTML:');
          elements.forEach(element => {
            const found = html.includes(element);
            console.log(`   ${found ? '✅' : '❌'} ${element}`);
          });
          
          // CSS de popup
          const cssElements = [
            '.popup-overlay',
            '.popup',
            '.popup.show',
            'animation: fadeIn',
            'animation: slideIn'
          ];
          
          console.log('\n🎨 Verificação de CSS:');
          cssElements.forEach(element => {
            const found = html.includes(element);
            console.log(`   ${found ? '✅' : '❌'} ${element}`);
          });
          
          // JavaScript
          const jsElements = [
            'src="/js/payment-form.js"',
            'id="payment-data"',
            'type="application/json"'
          ];
          
          console.log('\n⚡ Verificação de JavaScript:');
          jsElements.forEach(element => {
            const found = html.includes(element);
            console.log(`   ${found ? '✅' : '❌'} ${element}`);
          });
          
          // Verificar se há problemas
          const missingElements = elements.filter(element => !html.includes(element));
          if (missingElements.length > 0) {
            console.log('\n❌ PROBLEMA: Elementos HTML de popup não encontrados!');
            console.log('   Elementos ausentes:', missingElements);
          }
          
          const missingCSS = cssElements.filter(element => !html.includes(element));
          if (missingCSS.length > 0) {
            console.log('\n❌ PROBLEMA: CSS de popup não encontrado!');
            console.log('   CSS ausente:', missingCSS);
          }
          
          const missingJS = jsElements.filter(element => !html.includes(element));
          if (missingJS.length > 0) {
            console.log('\n❌ PROBLEMA: JavaScript não configurado corretamente!');
            console.log('   JS ausente:', missingJS);
          }
          
          if (missingElements.length === 0 && missingCSS.length === 0 && missingJS.length === 0) {
            console.log('\n🎉 Todos os elementos estão presentes!');
            console.log('   O problema pode estar no JavaScript ou na execução.');
          }
          
        } else {
          console.log('❌ Erro ao acessar formulário:', formResponse.status);
        }
        
      } else {
        console.log('❌ Erro ao criar pagamento:', responseData.message);
      }
    } else {
      console.log('❌ Erro HTTP:', createResponse.status);
      console.log('Response:', createResponse.data);
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
  }
}

// Executar debug
setTimeout(() => {
  debugPopups();
}, 2000);
