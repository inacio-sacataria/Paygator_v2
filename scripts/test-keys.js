#!/usr/bin/env node

const https = require('https');
const http = require('http');

/**
 * Script para testar chaves de API
 */
function testApiKeys() {
  console.log('🧪 Testando chaves de API...\n');

  // Configurações
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const mainApiKey = process.env.API_KEY || 'main_2abfa6c29029205ece6ad5683b513ae3281de225d167eddf3638b6f1530223df';
  const playfoodApiKey = process.env.PLAYFOOD_API_KEY || 'playfood_3e94628438fd9e7e873d40184cc9f09a0fbdd22a421a0078';

  console.log('📋 Configurações:');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Main API Key: ${mainApiKey.substring(0, 20)}...`);
  console.log(`Playfood API Key: ${playfoodApiKey.substring(0, 20)}...`);
  console.log('');

  // Testes
  const tests = [
    {
      name: 'Status da API Playfood',
      url: `${baseUrl}/api/v1/playfood/status`,
      headers: { 'X-API-Key': playfoodApiKey },
      method: 'GET'
    },
    {
      name: 'Listar Pedidos (Playfood)',
      url: `${baseUrl}/api/v1/playfood/orders?page=1&limit=5`,
      headers: { 'X-API-Key': playfoodApiKey },
      method: 'GET'
    },
    {
      name: 'Listar Webhooks',
      url: `${baseUrl}/api/v1/webhooks/list`,
      headers: { 'X-API-Key': mainApiKey },
      method: 'GET'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  tests.forEach((test, index) => {
    console.log(`🔍 Teste ${index + 1}: ${test.name}`);
    
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        ...test.headers
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Sucesso (${res.statusCode}): ${test.name}`);
            passedTests++;
          } else {
            console.log(`❌ Erro (${res.statusCode}): ${test.name}`);
            console.log(`   Resposta: ${data.substring(0, 200)}...`);
          }
        } catch (error) {
          console.log(`❌ Erro de parsing: ${test.name}`);
          console.log(`   Resposta: ${data.substring(0, 200)}...`);
        }
        
        console.log('');
        
        // Se foi o último teste, mostrar resumo
        if (index === totalTests - 1) {
          showSummary(passedTests, totalTests);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro de conexão: ${test.name}`);
      console.log(`   Erro: ${error.message}`);
      console.log('');
      
      if (index === totalTests - 1) {
        showSummary(passedTests, totalTests);
      }
    });

    req.end();
  });
}

/**
 * Mostra resumo dos testes
 */
function showSummary(passed, total) {
  console.log('📊 RESUMO DOS TESTES:');
  console.log('=====================');
  console.log(`✅ Testes aprovados: ${passed}/${total}`);
  console.log(`❌ Testes falharam: ${total - passed}/${total}`);
  console.log(`📈 Taxa de sucesso: ${Math.round((passed / total) * 100)}%`);
  console.log('');

  if (passed === total) {
    console.log('🎉 Todas as chaves estão funcionando corretamente!');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique:');
    console.log('   - Se o servidor está rodando');
    console.log('   - Se as chaves estão corretas');
    console.log('   - Se as variáveis de ambiente estão configuradas');
  }
}

/**
 * Valida formato das chaves
 */
function validateKeyFormat() {
  console.log('🔍 Validando formato das chaves...\n');

  const mainApiKey = process.env.API_KEY || 'main_2abfa6c29029205ece6ad5683b513ae3281de225d167eddf3638b6f1530223df';
  const playfoodApiKey = process.env.PLAYFOOD_API_KEY || 'playfood_3e94628438fd9e7e873d40184cc9f09a0fbdd22a421a0078';

  const mainApiKeyRegex = /^main_[a-f0-9]{64}$/i;
  const playfoodApiKeyRegex = /^playfood_[a-f0-9]{48}$/i;

  console.log('📋 Validação de formato:');
  console.log(`Main API Key: ${mainApiKeyRegex.test(mainApiKey) ? '✅' : '❌'} ${mainApiKey.substring(0, 20)}...`);
  console.log(`Playfood API Key: ${playfoodApiKeyRegex.test(playfoodApiKey) ? '✅' : '❌'} ${playfoodApiKey.substring(0, 20)}...`);
  console.log('');

  return mainApiKeyRegex.test(mainApiKey) && playfoodApiKeyRegex.test(playfoodApiKey);
}

/**
 * Função principal
 */
function main() {
  console.log('🚀 PAYGATOR API - TESTE DE CHAVES\n');

  // Validar formato das chaves
  const keysValid = validateKeyFormat();
  
  if (!keysValid) {
    console.log('❌ Formato das chaves inválido. Execute: npm run generate-keys');
    process.exit(1);
  }

  // Testar conectividade
  testApiKeys();
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { testApiKeys, validateKeyFormat }; 