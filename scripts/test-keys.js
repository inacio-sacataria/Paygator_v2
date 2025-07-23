#!/usr/bin/env node

const http = require('http');

// API keys from the generated keys
const API_KEYS = {
  main: 'main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e',
  playfood: 'playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5',
  invalid: 'invalid_key_123456789'
};

// Test configuration
const TEST_CONFIG = {
  host: 'localhost',
  port: 3000,
  path: '/api/v1/playfood/status',
  method: 'GET'
};

/**
 * Test API key authentication
 */
function testApiKey(apiKey, description) {
  return new Promise((resolve, reject) => {
    const options = {
      ...TEST_CONFIG,
      headers: {
        'X-API-Key': apiKey,
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
            description,
            statusCode: res.statusCode,
            success: response.success,
            message: response.message,
            apiKey: apiKey.substring(0, 20) + '...'
          });
        } catch (error) {
          resolve({
            description,
            statusCode: res.statusCode,
            success: false,
            message: 'Invalid JSON response',
            apiKey: apiKey.substring(0, 20) + '...'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        description,
        error: error.message,
        apiKey: apiKey.substring(0, 20) + '...'
      });
    });

    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🔍 Testando autenticação de chaves de API...\n');
  
  const tests = [
    { key: API_KEYS.main, description: 'Main API Key (válida)' },
    { key: API_KEYS.playfood, description: 'Playfood API Key (válida)' },
    { key: API_KEYS.invalid, description: 'API Key inválida' },
    { key: '', description: 'API Key ausente' }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await testApiKey(test.key, test.description);
      results.push(result);
    } catch (error) {
      results.push({
        description: test.description,
        error: error.error,
        apiKey: test.key ? test.key.substring(0, 20) + '...' : 'ausente'
      });
    }
  }

  // Display results
  console.log('📊 RESULTADOS DOS TESTES:');
  console.log('==========================\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.description}`);
    console.log(`   Chave: ${result.apiKey}`);
    
    if (result.error) {
      console.log(`   ❌ Erro: ${result.error}`);
    } else {
      console.log(`   Status: ${result.statusCode}`);
      console.log(`   Sucesso: ${result.success ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Mensagem: ${result.message}`);
    }
    console.log('');
  });

  // Summary
  const validKeys = results.filter(r => !r.error && r.success);
  const invalidKeys = results.filter(r => !r.error && !r.success);
  const errors = results.filter(r => r.error);

  console.log('📋 RESUMO:');
  console.log('==========');
  console.log(`✅ Chaves válidas: ${validKeys.length}`);
  console.log(`❌ Chaves inválidas: ${invalidKeys.length}`);
  console.log(`🚫 Erros de conexão: ${errors.length}`);

  if (validKeys.length >= 2) {
    console.log('\n🎉 SUCESSO: Sistema de autenticação funcionando corretamente!');
    console.log('   As chaves main e playfood estão sendo aceitas.');
  } else {
    console.log('\n⚠️  ATENÇÃO: Algumas chaves válidas não estão funcionando.');
    console.log('   Verifique a configuração do servidor.');
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testApiKey, runTests }; 