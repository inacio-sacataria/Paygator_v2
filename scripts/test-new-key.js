#!/usr/bin/env node

const http = require('http');

// Test the new API key provided by the user
const NEW_API_KEY = 'main_70a3ae2d414936451d05d19f7ca4b01c1761ee04b519b93961f56fa2a27cc914';

// Test different endpoints
const testEndpoints = [
  {
    name: 'Status PlayFood',
    path: '/api/v1/playfood/status',
    method: 'GET'
  },
  {
    name: 'Criar Pagamento',
    path: '/api/v1/payments/create',
    method: 'POST',
    body: JSON.stringify({ amount: 100.50 })
  },
  {
    name: 'Health Check',
    path: '/health',
    method: 'GET'
  }
];

async function testEndpoint(testEndpoint) {
  return new Promise((resolve) => {
    const options = {
      host: 'localhost',
      port: 3000,
      path: testEndpoint.path,
      method: testEndpoint.method,
      headers: {
        'X-API-Key': NEW_API_KEY,
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
            name: testEndpoint.name,
            statusCode: res.statusCode,
            success: response.success !== false,
            message: response.message || 'No message',
            data: response.data ? 'Data present' : 'No data'
          });
        } catch (error) {
          resolve({
            name: testEndpoint.name,
            statusCode: res.statusCode,
            success: res.statusCode < 400,
            message: 'Invalid JSON response',
            rawResponse: data.substring(0, 100) + '...'
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        name: testEndpoint.name,
        error: error.message
      });
    });

    if (testEndpoint.body) {
      req.write(testEndpoint.body);
    }
    req.end();
  });
}

async function runTest() {
  console.log('🔍 Testando nova chave de API...\n');
  console.log(`Chave: ${NEW_API_KEY.substring(0, 20)}...`);
  console.log('');
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    console.log(`Testando: ${endpoint.name}...`);
    const result = await testEndpoint(endpoint);
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
      if (result.data) {
        console.log(`   Dados: ${result.data}`);
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
  
  if (successfulTests.length === results.length) {
    console.log('\n🎉 SUCESSO: Nova chave de API está funcionando perfeitamente!');
    console.log('   A chave foi aceita em todos os endpoints testados.');
  } else if (successfulTests.length > 0) {
    console.log('\n⚠️  PARCIAL: Nova chave funciona em alguns endpoints.');
    console.log('   Pode haver problemas específicos em alguns endpoints.');
  } else {
    console.log('\n❌ FALHA: Nova chave não está funcionando.');
    console.log('   A chave precisa ser adicionada ao sistema de autenticação.');
  }
  
  // Verificar se precisa adicionar a chave
  if (failedTests.length > 0 && failedTests.some(r => r.statusCode === 401)) {
    console.log('\n💡 RECOMENDAÇÃO:');
    console.log('   A chave precisa ser adicionada ao arquivo de configuração.');
    console.log('   Adicione a chave ao arquivo .env ou à configuração do servidor.');
  }
}

runTest().catch(console.error); 