#!/usr/bin/env node

// Load the compiled configuration
const { config } = require('../dist/config/environment');

console.log('🔍 Debug: Verificando configuração de chaves de API...\n');

console.log('📋 CONFIGURAÇÃO ATUAL:');
console.log('======================');
console.log(`API Keys configuradas: ${config.security.apiKeys.length}`);
console.log('');

config.security.apiKeys.forEach((key, index) => {
  console.log(`${index + 1}. ${key}`);
});

console.log('\n📋 TESTE DE VALIDAÇÃO:');
console.log('======================');

// Test keys from the test script
const testKeys = [
  'main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e',
  'playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5',
  'invalid_key_123456789'
];

testKeys.forEach((key, index) => {
  const isValid = config.security.apiKeys.includes(key);
  console.log(`${index + 1}. ${key.substring(0, 20)}... - ${isValid ? '✅ Válida' : '❌ Inválida'}`);
});

console.log('\n📋 VARIÁVEIS DE AMBIENTE:');
console.log('=========================');
console.log(`API_KEY: ${process.env.API_KEY || 'não definida'}`);
console.log(`PLAYFOOD_API_KEY: ${process.env.PLAYFOOD_API_KEY || 'não definida'}`);
console.log(`API_KEY_SECRET: ${process.env.API_KEY_SECRET || 'não definida'}`);

console.log('\n💡 DICAS:');
console.log('- Se as chaves não estão sendo reconhecidas, verifique se o servidor foi reiniciado');
console.log('- As chaves padrão estão hardcoded no código, então devem funcionar');
console.log('- Se ainda não funcionar, pode haver um problema de cache'); 