#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Gera uma chave de API aleatória
 * @param {string} prefix - Prefixo para identificar o tipo de chave
 * @param {number} length - Comprimento da chave (padrão: 32)
 * @returns {string} Chave de API formatada
 */
function generateApiKey(prefix = 'pk', length = 32) {
  const randomBytes = crypto.randomBytes(length);
  const key = randomBytes.toString('hex');
  return `${prefix}_${key}`;
}

/**
 * Gera uma chave secreta para webhooks
 * @param {number} length - Comprimento da chave (padrão: 64)
 * @returns {string} Chave secreta
 */
function generateWebhookSecret(length = 64) {
  const randomBytes = crypto.randomBytes(length);
  return randomBytes.toString('hex');
}

/**
 * Gera múltiplas chaves para diferentes ambientes
 * @returns {Object} Objeto com chaves para diferentes ambientes
 */
function generateEnvironmentKeys() {
  return {
    development: {
      mainApiKey: generateApiKey('main', 32),
      playfoodApiKey: generateApiKey('playfood', 24),
      webhookSecret: generateWebhookSecret(32)
    },
    staging: {
      mainApiKey: generateApiKey('main', 32),
      playfoodApiKey: generateApiKey('playfood', 24),
      webhookSecret: generateWebhookSecret(32)
    },
    production: {
      mainApiKey: generateApiKey('main', 32),
      playfoodApiKey: generateApiKey('playfood', 24),
      webhookSecret: generateWebhookSecret(64)
    }
  };
}

/**
 * Função principal para gerar chaves
 */
function generateKeys() {
  console.log('🔑 Gerando chaves de API para Paygator...\n');

  const keys = generateEnvironmentKeys();

  console.log('📋 CHAVES PARA DESENVOLVIMENTO:');
  console.log('================================');
  console.log(`Main API Key: ${keys.development.mainApiKey}`);
  console.log(`Playfood API Key: ${keys.development.playfoodApiKey}`);
  console.log(`Webhook Secret: ${keys.development.webhookSecret}`);
  console.log('');

  console.log('📋 CHAVES PARA STAGING:');
  console.log('=======================');
  console.log(`Main API Key: ${keys.staging.mainApiKey}`);
  console.log(`Playfood API Key: ${keys.staging.playfoodApiKey}`);
  console.log(`Webhook Secret: ${keys.staging.webhookSecret}`);
  console.log('');

  console.log('📋 CHAVES PARA PRODUÇÃO:');
  console.log('========================');
  console.log(`Main API Key: ${keys.production.mainApiKey}`);
  console.log(`Playfood API Key: ${keys.production.playfoodApiKey}`);
  console.log(`Webhook Secret: ${keys.production.webhookSecret}`);
  console.log('');

  console.log('💡 DICAS:');
  console.log('- Use as chaves de desenvolvimento para testes locais');
  console.log('- Use as chaves de staging para testes em ambiente controlado');
  console.log('- Use as chaves de produção apenas em produção');
  console.log('- Mantenha as chaves seguras e não as compartilhe');
  console.log('- Rotacione as chaves periodicamente por segurança');
  console.log('');

  console.log('📝 PRÓXIMOS PASSOS:');
  console.log('1. Copie as chaves para seu arquivo .env');
  console.log('2. Configure as variáveis no Postman');
  console.log('3. Teste a API com as novas chaves');
  console.log('4. Mantenha backup das chaves em local seguro');

  return keys;
}

// Executar se chamado diretamente
if (require.main === module) {
  generateKeys();
}

module.exports = { generateKeys, generateApiKey, generateWebhookSecret }; 