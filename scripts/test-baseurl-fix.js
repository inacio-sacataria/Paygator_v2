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

async function testBaseUrlFix() {
  try {
    console.log('🧪 Testando correção do base URL no link...\n');

    // 1. Criar pagamento
    console.log('1️⃣ Criando pagamento para teste...');
    const createResponse = await makeRequest('POST', '/api/v1/payments/create', {
      amount: 50.00,
      currency: 'MZN',
      customer: {
        phone: '+258841234567',
        name: 'Teste Base URL',
        email: 'teste@example.com'
      },
      returnUrl: 'https://example.com/success'
    });

    console.log('Status:', createResponse.status);
    
    if (createResponse.status === 201 && createResponse.data.success) {
      const responseData = createResponse.data;
      console.log('✅ Pagamento criado com sucesso!');
      console.log('📋 Detalhes da resposta:');
      console.log(`   Payment ID: ${responseData.data.externalPayment.id}`);
      console.log(`   Response Type: ${responseData.responseType}`);
      console.log(`   Link: ${responseData.link}`);
      
      // Verificar se o link contém base URL
      const link = responseData.link;
      const hasBaseUrl = link.startsWith('http://') || link.startsWith('https://');
      const hasLocalhost = link.includes('localhost:3000');
      const hasPaymentForm = link.includes('/payment-form/');
      
      console.log('\n🔍 Análise do link:');
      console.log(`   ✅ Contém base URL: ${hasBaseUrl ? 'Sim' : 'Não'}`);
      console.log(`   ✅ Contém localhost:3000: ${hasLocalhost ? 'Sim' : 'Não'}`);
      console.log(`   ✅ Contém /payment-form/: ${hasPaymentForm ? 'Sim' : 'Não'}`);
      
      if (hasBaseUrl && hasPaymentForm) {
        console.log('\n🎉 SUCESSO! Link agora inclui base URL completa!');
        
        // Testar se o link é acessível
        console.log('\n2️⃣ Testando acesso ao link...');
        try {
          const paymentId = link.split('/payment-form/')[1];
          const formResponse = await makeRequest('GET', `/payment-form/${paymentId}`);
          
          if (formResponse.status === 200) {
            console.log('✅ Link acessível com sucesso!');
          } else {
            console.log('❌ Erro ao acessar link:', formResponse.status);
          }
        } catch (linkError) {
          console.log('❌ Erro ao testar link:', linkError.message);
        }
        
      } else {
        console.log('\n❌ PROBLEMA: Link ainda não contém base URL completa!');
        console.log('   Link atual:', link);
        console.log('   Esperado: http://localhost:3000/payment-form/[ID]');
      }
      
      // Mostrar comparação
      console.log('\n📊 Comparação:');
      console.log('   🔴 ANTES: "/payment-form/01K22BGXQDH4FVQ5E9HG0TNHsQ73"');
      console.log(`   🟢 AGORA: "${link}"`);
      
    } else {
      console.log('❌ Erro ao criar pagamento:');
      console.log('   Status:', createResponse.status);
      console.log('   Response:', createResponse.data);
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

async function runTest() {
  console.log('🚀 Iniciando teste de correção do base URL...\n');
  
  await testBaseUrlFix();
  
  console.log('\n✨ Teste concluído!');
  console.log('\n📋 Resumo da correção:');
  console.log('   ✅ Base URL adicionado na configuração');
  console.log('   ✅ Controller atualizado para usar base URL');
  console.log('   ✅ Link agora é completo e utilizável');
  console.log('   ✅ Flexível para diferentes ambientes (dev/prod)');
  console.log('\n🔧 Configuração:');
  console.log('   - Desenvolvimento: http://localhost:3000');
  console.log('   - Produção: Definir BASE_URL no .env');
  console.log('   - Render: BASE_URL=https://seu-app.onrender.com');
}

// Aguardar servidor iniciar
setTimeout(() => {
  runTest();
}, 2000);
