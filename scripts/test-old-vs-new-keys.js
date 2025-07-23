#!/usr/bin/env node

const http = require('http');

// Test both old and new keys
const testKeys = [
  { name: 'New Main Key', key: 'main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e' },
  { name: 'New Playfood Key', key: 'playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5' },
  { name: 'Old Main Key', key: 'main_2abfa6c29029205ece6ad5683b513ae3281de225d167eddf3638b6f1530223df' },
  { name: 'Old Playfood Key', key: 'playfood_3e94628438fd9e7e873d40184cc9f09a0fbdd22a421a0078' },
  { name: 'Default Key', key: 'default-api-key-secret' }
];

async function testKey(testKey) {
  return new Promise((resolve) => {
    const options = {
      host: 'localhost',
      port: 3000,
      path: '/api/v1/playfood/status',
      method: 'GET',
      headers: {
        'X-API-Key': testKey.key,
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
            name: testKey.name,
            key: testKey.key.substring(0, 20) + '...',
            statusCode: res.statusCode,
            success: response.success,
            message: response.message
          });
        } catch (error) {
          resolve({
            name: testKey.name,
            key: testKey.key.substring(0, 20) + '...',
            statusCode: res.statusCode,
            success: false,
            message: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        name: testKey.name,
        key: testKey.key.substring(0, 20) + '...',
        error: error.message
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testando chaves antigas vs novas...\n');
  
  const results = [];
  
  for (const testKey of testKeys) {
    const result = await testKey(testKey);
    results.push(result);
  }
  
  console.log('📊 RESULTADOS:');
  console.log('==============\n');
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}`);
    console.log(`   Chave: ${result.key}`);
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
  const newKeys = results.filter(r => r.name.includes('New'));
  const oldKeys = results.filter(r => r.name.includes('Old') || r.name.includes('Default'));
  
  console.log('📋 RESUMO:');
  console.log('==========');
  console.log(`✅ Chaves funcionando: ${workingKeys.length}/${results.length}`);
  console.log(`🆕 Novas chaves funcionando: ${newKeys.filter(r => !r.error && r.success).length}/${newKeys.length}`);
  console.log(`🔄 Chaves antigas funcionando: ${oldKeys.filter(r => !r.error && r.success).length}/${oldKeys.length}`);
  
  if (newKeys.filter(r => !r.error && r.success).length === 0) {
    console.log('\n⚠️  PROBLEMA: As novas chaves não estão funcionando!');
    console.log('   O servidor pode não ter sido reiniciado com a nova configuração.');
    console.log('   Tente reiniciar o servidor: npm run build && npm start');
  } else {
    console.log('\n🎉 SUCESSO: Todas as chaves estão funcionando!');
  }
}

runTests().catch(console.error); 