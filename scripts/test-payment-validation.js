#!/usr/bin/env node

const http = require('http');

// Test different payment payloads
const testPayloads = [
  {
    name: 'Payload mínimo (apenas amount)',
    payload: { amount: 100.50 }
  },
  {
    name: 'Payload com amount e currency',
    payload: { amount: 200.75, currency: 'USD' }
  },
  {
    name: 'Payload completo',
    payload: {
      paymentId: 'pay_test_001',
      externalPaymentId: 123456,
      paymentMethod: 'credit_card',
      amount: 150.25,
      currency: 'BRL',
      customer: {
        email: 'test@example.com',
        phone: '+5511999999999',
        name: 'Test Customer'
      },
      locale: 'pt-BR',
      returnUrl: 'https://example.com/success'
    }
  },
  {
    name: 'Payload inválido (sem amount)',
    payload: { currency: 'BRL' }
  },
  {
    name: 'Payload vazio',
    payload: {}
  }
];

// Use a working API key
const API_KEY = 'main_2abfa6c29029205ece6ad5683b513ae3281de225d167eddf3638b6f1530223df';

async function testPaymentPayload(testPayload) {
  return new Promise((resolve) => {
    const options = {
      host: 'localhost',
      port: 3000,
      path: '/api/v1/payments/create',
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            name: testPayload.name,
            statusCode: res.statusCode,
            success: response.success,
            message: response.message,
            errors: response.errors || []
          });
        } catch (error) {
          resolve({
            name: testPayload.name,
            statusCode: res.statusCode,
            success: false,
            message: 'Invalid JSON response',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        name: testPayload.name,
        error: error.message
      });
    });

    req.write(JSON.stringify(testPayload.payload));
    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testando validação de pagamentos...\n');
  
  const results = [];
  
  for (const testPayload of testPayloads) {
    console.log(`Testando: ${testPayload.name}...`);
    const result = await testPaymentPayload(testPayload);
    results.push(result);
  }
  
  console.log('\n📊 RESULTADOS:');
  console.log('==============\n');
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}`);
    if (result.error) {
      console.log(`   ❌ Erro de Conexão: ${result.error}`);
    } else {
      console.log(`   Status HTTP: ${result.statusCode}`);
      console.log(`   Sucesso: ${result.success ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Mensagem: ${result.message}`);
      if (result.errors && result.errors.length > 0) {
        console.log(`   Erros: ${result.errors.join(', ')}`);
      }
    }
    console.log('');
  });
  
  // Análise dos resultados
  const successfulTests = results.filter(r => !r.error && r.success);
  const failedTests = results.filter(r => !r.error && !r.success);
  const connectionErrors = results.filter(r => r.error);
  
  console.log('📋 ANÁLISE:');
  console.log('===========');
  console.log(`✅ Testes bem-sucedidos: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Testes que falharam: ${failedTests.length}/${results.length}`);
  console.log(`🚫 Erros de conexão: ${connectionErrors.length}/${results.length}`);
  
  // Verificar se a validação está funcionando corretamente
  const minPayloadTest = results.find(r => r.name.includes('Payload mínimo'));
  const invalidPayloadTest = results.find(r => r.name.includes('sem amount'));
  
  console.log('\n🔧 DIAGNÓSTICO:');
  console.log('===============');
  
  if (minPayloadTest && minPayloadTest.success) {
    console.log('✅ Payload mínimo (apenas amount) está funcionando!');
  } else {
    console.log('❌ Payload mínimo não está funcionando');
  }
  
  if (invalidPayloadTest && !invalidPayloadTest.success) {
    console.log('✅ Validação está rejeitando payloads sem amount!');
  } else {
    console.log('❌ Validação não está rejeitando payloads sem amount');
  }
  
  if (successfulTests.length >= 3) {
    console.log('\n🎉 SUCESSO: Validação flexível está funcionando!');
    console.log('   A API agora aceita payloads parciais com apenas o campo amount obrigatório.');
  } else {
    console.log('\n⚠️  ATENÇÃO: Alguns testes falharam.');
    console.log('   Verifique se o servidor foi reiniciado com as novas mudanças.');
  }
}

runTests().catch(console.error); 