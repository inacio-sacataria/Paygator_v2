#!/usr/bin/env node

const http = require('http');

// Test different API keys
const testKeys = [
  { name: 'Nova Chave Main', key: 'main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e' },
  { name: 'Nova Chave Playfood', key: 'playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5' },
  { name: 'Chave Main Antiga', key: 'main_2abfa6c29029205ece6ad5683b513ae3281de225d167eddf3638b6f1530223df' },
  { name: 'Chave Playfood Antiga', key: 'playfood_3e94628438fd9e7e873d40184cc9f09a0fbdd22a421a0078' },
  { name: 'Chave Padrão', key: 'default-api-key-secret' }
];

async function testApiKey(testKey) {
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
            message: response.message,
            data: response.data
          });
        } catch (error) {
          resolve({
            name: testKey.name,
            key: testKey.key.substring(0, 20) + '...',
            statusCode: res.statusCode,
            success: false,
            message: 'Resposta JSON inválida',
            rawResponse: data
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

async function runDiagnostic() {
  console.log('🔍 DIAGNÓSTICO DE AUTENTICAÇÃO DE API KEYS');
  console.log('==========================================\n');
  
  const results = [];
  
  for (const testKey of testKeys) {
    console.log(`Testando: ${testKey.name}...`);
    const result = await testApiKey(testKey);
    results.push(result);
  }
  
  console.log('\n📊 RESULTADOS DETALHADOS:');
  console.log('==========================\n');
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}`);
    console.log(`   Chave: ${result.key}`);
    if (result.error) {
      console.log(`   ❌ Erro de Conexão: ${result.error}`);
    } else {
      console.log(`   Status HTTP: ${result.statusCode}`);
      console.log(`   Sucesso: ${result.success ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Mensagem: ${result.message}`);
      if (result.data) {
        console.log(`   Dados: ${JSON.stringify(result.data).substring(0, 100)}...`);
      }
    }
    console.log('');
  });
  
  // Análise dos resultados
  const workingKeys = results.filter(r => !r.error && r.success);
  const newKeys = results.filter(r => r.name.includes('Nova'));
  const oldKeys = results.filter(r => r.name.includes('Antiga') || r.name.includes('Padrão'));
  
  console.log('📋 ANÁLISE:');
  console.log('===========');
  console.log(`✅ Chaves funcionando: ${workingKeys.length}/${results.length}`);
  console.log(`🆕 Novas chaves funcionando: ${newKeys.filter(r => !r.error && r.success).length}/${newKeys.length}`);
  console.log(`🔄 Chaves antigas funcionando: ${oldKeys.filter(r => !r.error && r.success).length}/${oldKeys.length}`);
  
  // Diagnóstico
  console.log('\n🔧 DIAGNÓSTICO:');
  console.log('===============');
  
  if (workingKeys.length === 0) {
    console.log('❌ PROBLEMA CRÍTICO: Nenhuma chave está funcionando!');
    console.log('   - Verifique se o servidor está rodando');
    console.log('   - Verifique se a porta 3000 está disponível');
    console.log('   - Verifique os logs do servidor');
  } else if (newKeys.filter(r => !r.error && r.success).length === 0) {
    console.log('⚠️  PROBLEMA: As novas chaves não estão funcionando!');
    console.log('   - O servidor pode não ter sido reiniciado com a nova configuração');
    console.log('   - Execute: npm run build && npm start');
    console.log('   - Verifique se o arquivo .env está configurado corretamente');
  } else if (oldKeys.filter(r => !r.error && r.success).length === 0) {
    console.log('⚠️  PROBLEMA: As chaves antigas não estão funcionando!');
    console.log('   - Pode haver um problema de compatibilidade');
    console.log('   - Verifique a configuração de autenticação');
  } else {
    console.log('✅ SUCESSO: Todas as chaves estão funcionando!');
  }
  
  // Recomendações
  console.log('\n💡 RECOMENDAÇÕES:');
  console.log('==================');
  
  if (newKeys.filter(r => !r.error && r.success).length === 0) {
    console.log('1. Reinicie o servidor com a nova configuração:');
    console.log('   npm run build && npm start');
    console.log('');
    console.log('2. Verifique se o arquivo .env existe e está configurado:');
    console.log('   API_KEY=main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e');
    console.log('   PLAYFOOD_API_KEY=playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5');
    console.log('');
    console.log('3. Use uma das chaves que funcionam:');
    workingKeys.forEach(key => {
      console.log(`   - ${key.name}: ${key.key}`);
    });
  } else {
    console.log('1. Use as chaves que estão funcionando:');
    workingKeys.forEach(key => {
      console.log(`   - ${key.name}: ${key.key}`);
    });
    console.log('');
    console.log('2. Para usar as novas chaves, reinicie o servidor.');
  }
}

runDiagnostic().catch(console.error); 