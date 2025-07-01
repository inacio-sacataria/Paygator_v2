import crypto from 'crypto';

/**
 * Utilitário para gerar chaves de API seguras
 */
export class KeyGenerator {
  /**
   * Gera uma chave de API aleatória
   * @param prefix - Prefixo para identificar o tipo de chave
   * @param length - Comprimento da chave (padrão: 32)
   * @returns Chave de API formatada
   */
  static generateApiKey(prefix: string = 'pk', length: number = 32): string {
    const randomBytes = crypto.randomBytes(length);
    const key = randomBytes.toString('hex');
    return `${prefix}_${key}`;
  }

  /**
   * Gera uma chave de API Playfood
   * @returns Chave de API Playfood formatada
   */
  static generatePlayfoodApiKey(): string {
    return this.generateApiKey('playfood', 24);
  }

  /**
   * Gera uma chave de API principal
   * @returns Chave de API principal formatada
   */
  static generateMainApiKey(): string {
    return this.generateApiKey('main', 32);
  }

  /**
   * Gera uma chave secreta para webhooks
   * @param length - Comprimento da chave (padrão: 64)
   * @returns Chave secreta
   */
  static generateWebhookSecret(length: number = 64): string {
    const randomBytes = crypto.randomBytes(length);
    return randomBytes.toString('hex');
  }

  /**
   * Gera uma assinatura HMAC para webhooks
   * @param payload - Payload do webhook
   * @param secret - Chave secreta
   * @returns Assinatura HMAC
   */
  static generateWebhookSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Gera múltiplas chaves para diferentes ambientes
   * @returns Objeto com chaves para diferentes ambientes
   */
  static generateEnvironmentKeys() {
    return {
      development: {
        mainApiKey: this.generateMainApiKey(),
        playfoodApiKey: this.generatePlayfoodApiKey(),
        webhookSecret: this.generateWebhookSecret(32)
      },
      staging: {
        mainApiKey: this.generateMainApiKey(),
        playfoodApiKey: this.generatePlayfoodApiKey(),
        webhookSecret: this.generateWebhookSecret(32)
      },
      production: {
        mainApiKey: this.generateMainApiKey(),
        playfoodApiKey: this.generatePlayfoodApiKey(),
        webhookSecret: this.generateWebhookSecret(64)
      }
    };
  }

  /**
   * Valida se uma chave de API tem formato válido
   * @param apiKey - Chave de API para validar
   * @returns true se a chave é válida
   */
  static isValidApiKey(apiKey: string): boolean {
    // Verifica se a chave tem o formato correto: prefix_hexstring
    const apiKeyRegex = /^[a-z]+_[a-f0-9]{16,}$/i;
    return apiKeyRegex.test(apiKey);
  }

  /**
   * Extrai o prefixo de uma chave de API
   * @param apiKey - Chave de API
   * @returns Prefixo da chave
   */
  static getApiKeyPrefix(apiKey: string): string | null {
    const match = apiKey.match(/^([a-z]+)_/i);
    return match ? match[1] || null : null;
  }
}

/**
 * Função para gerar chaves via linha de comando
 */
export function generateKeys() {
  console.log('🔑 Gerando chaves de API para Paygator...\n');

  const keys = KeyGenerator.generateEnvironmentKeys();

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

  return keys;
}

// Se executado diretamente
if (require.main === module) {
  generateKeys();
} 