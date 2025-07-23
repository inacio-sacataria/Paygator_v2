#!/usr/bin/env node

const http = require('http');

// Test with the main API key
const apiKey = 'main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e';

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

console.log('🔍 Testando chave de API...');
console.log(`Chave: ${apiKey.substring(0, 20)}...`);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Resposta: ${data}`);
    
    if (res.statusCode === 200) {
      console.log('✅ SUCESSO: Chave de API funcionando!');
    } else {
      console.log('❌ FALHA: Chave de API não funcionando');
    }
  });
});

req.on('error', (error) => {
  console.log(`❌ Erro: ${error.message}`);
});

req.end(); 