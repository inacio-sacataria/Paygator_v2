const http = require('http');

console.log('🧪 Testando correção do CSP...\n');

// Configuração
const hostname = '127.0.0.1';
const port = 3000;
const apiKey = 'main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e';

// Função para fazer requisições HTTP
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

async function testCSPFix() {
  try {
    console.log('🔥 1. Criando pagamento de teste...');
    
    // 1. Criar um pagamento
    const createPaymentOptions = {
      hostname,
      port,
      path: '/api/v1/payments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    };

    const paymentData = JSON.stringify({
      paymentId: `test_csp_${Date.now()}`,
      paymentMethod: 'mpesa',
      amount: 100,
      currency: 'MZN',
      customer: {
        phone: '258841234567',
        name: 'Teste CSP'
      },
      locale: 'pt',
      returnUrl: 'https://example.com/success',
      orderDetails: {
        orderId: 'order_csp_test',
        public: {
          vendorId: 'vendor123',
          vendorName: 'Teste Vendor',
          cartTotal: 100,
          deliveryTotal: 0,
          taxTotal: 0,
          serviceFeeTotal: 0,
          discountTotal: 0
        }
      }
    });

    const createResponse = await makeRequest(createPaymentOptions, paymentData);
    console.log(`   Status: ${createResponse.statusCode}`);
    
    if (createResponse.statusCode !== 200 && createResponse.statusCode !== 201) {
      console.log('❌ Erro ao criar pagamento:', createResponse.data);
      return;
    }

    const paymentResult = JSON.parse(createResponse.data);
    console.log('✅ Pagamento criado:', paymentResult.externalPayment.id);
    
    // Extrair payment ID da resposta
    const paymentId = paymentResult.externalPayment.id;
    
    // 2. Testar acesso ao formulário de pagamento
    console.log('\n🎯 2. Testando acesso ao formulário de pagamento...');
    
    const formOptions = {
      hostname,
      port,
      path: `/payment-form/${paymentId}`,
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Test) AppleWebKit/537.36'
      }
    };

    const formResponse = await makeRequest(formOptions);
    console.log(`   Status: ${formResponse.statusCode}`);
    console.log(`   Content-Type: ${formResponse.headers['content-type'] || 'N/A'}`);
    
    if (formResponse.statusCode === 200) {
      console.log('✅ Formulário carregado com sucesso!');
      
      // Verificar se contém elementos essenciais
      const hasForm = formResponse.data.includes('<form');
      const hasScript = formResponse.data.includes('payment-form.js');
      const hasPopup = formResponse.data.includes('popup-overlay');
      
      console.log(`   📋 Contém formulário: ${hasForm ? '✅' : '❌'}`);
      console.log(`   📜 Contém script: ${hasScript ? '✅' : '❌'}`);
      console.log(`   🎭 Contém popup: ${hasPopup ? '✅' : '❌'}`);
      
      // Verificar CSP headers
      const cspHeader = formResponse.headers['content-security-policy'];
      console.log(`   🛡️ CSP Header: ${cspHeader ? 'PRESENTE' : 'AUSENTE'}`);
      
      if (cspHeader) {
        console.log(`   ⚠️ CSP ainda ativo: ${cspHeader}`);
      } else {
        console.log('   ✅ CSP desabilitado para payment-form!');
      }
      
    } else if (formResponse.statusCode === 500) {
      console.log('❌ Erro 500 - Detalhes:');
      console.log(formResponse.data.substring(0, 1000) + '...');
    } else {
      console.log('❌ Erro inesperado:', formResponse.statusCode);
      console.log(formResponse.data.substring(0, 500) + '...');
    }

    // 3. Testar acesso a arquivos estáticos
    console.log('\n📁 3. Testando acesso a arquivos estáticos...');
    
    const jsOptions = {
      hostname,
      port,
      path: '/js/payment-form.js',
      method: 'GET'
    };

    const jsResponse = await makeRequest(jsOptions);
    console.log(`   JavaScript Status: ${jsResponse.statusCode}`);
    
    if (jsResponse.statusCode === 200) {
      console.log('✅ JavaScript acessível!');
    } else {
      console.log('❌ JavaScript não acessível');
    }

  } catch (error) {
    console.log('❌ Erro durante teste:', error.message);
  }
}

// Executar teste
testCSPFix().then(() => {
  console.log('\n🎯 Teste de CSP concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Se local funcionou, fazer deploy');
  console.log('   2. Testar em produção: https://paygator-v2.onrender.com/payment-form/pay_12345d67sa89');
  console.log('   3. Verificar logs do Render se ainda houver erro 500');
}).catch(console.error);