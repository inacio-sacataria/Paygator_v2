#!/usr/bin/env node

const http = require('http');

// Test different keys to see which ones work
const testKeys = [
  'main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e',
  'playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5',
  'default-api-key-secret',
  'main_2abfa6c29029205ece6ad5683b513ae3281de225d167eddf3638b6f1530223df',
  'playfood_3e94628438fd9e7e873d40184cc9f09a0fbdd22a421a0078'
];

async function testKey(apiKey) {
  return new Promise((resolve) => {
    const options = {
      host: 'localhost',
      port: 3000,
      path: '/api/v1/playfood/status',
      method: 'GET',
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
            key: apiKey.substring(0, 20) + '...',
            statusCode: res.statusCode,
            success: response.success,
            message: response.message
          });
        } catch (error) {
          resolve({
            key: apiKey.substring(0, 20) + '...',
            statusCode: res.statusCode,
            success: false,
            message: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        key: apiKey.substring(0, 20) + '...',
        error: error.message
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testando diferentes chaves de API...\n');
  
  const results = [];
  
  for (const key of testKeys) {
    const result = await testKey(key);
    results.push(result);
  }
  
  console.log('📊 RESULTADOS:');
  console.log('==============\n');
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.key}`);
    if (result.error) {
      console.log(`   ❌ Erro: ${result.error}`);
    } else {
      console.log(`   Status: ${result.statusCode}`);
      console.log(`   Sucesso: ${result.success ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Mensagem: ${result.message}`);
    }
    console.log('');
  });
  
  const workingKeys = results.filter(r => !r.error && r.success);
  
  if (workingKeys.length > 0) {
    console.log('🎉 CHAVES FUNCIONANDO:');
    workingKeys.forEach(key => {
      console.log(`   ✅ ${key.key}`);
    });
  } else {
    console.log('⚠️  Nenhuma chave está funcionando.');
    console.log('   Verifique se o servidor foi reiniciado após as mudanças.');
  }
}

runTests().catch(console.error); 