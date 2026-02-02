# ===========================================
# CONFIGURAÇÃO DE AMBIENTE - PAYGATOR API
# ===========================================

# Ambiente de execução
NODE_ENV=development

# ===========================================
# CHAVES DE API
# ===========================================

# Chave principal da API (gerada com: npm run generate-keys)
API_KEY=main_2abfa6c29029205ece6ad5683b513ae3281de225d167eddf3638b6f1530223df

# Chave da API Playfood (gerada com: npm run generate-keys)
PLAYFOOD_API_KEY=playfood_3e94628438fd9e7e873d40184cc9f09a0fbdd22a421a0078

# Secret para assinatura de webhooks (gerada com: npm run generate-keys)
WEBHOOK_SECRET=0946d4691a3752afc2cb760fac9bfb33545aa0ef5a76bffe2eedf54217fa5775

# ===========================================
# CONFIGURAÇÕES DO SERVIDOR
# ===========================================

# Porta do servidor
PORT=3000

# Host do servidor
HOST=localhost

# ===========================================
# CONFIGURAÇÕES DE LOG
# ===========================================

# Nível de log (error, warn, info, debug)
LOG_LEVEL=info

# Diretório de logs
LOG_DIR=logs

# ===========================================
# CONFIGURAÇÕES DE RATE LIMITING
# ===========================================

# Limite de requisições por minuto para API
API_RATE_LIMIT=100

# Limite de requisições por minuto para webhooks
WEBHOOK_RATE_LIMIT=50

# ===========================================
# CONFIGURAÇÕES DE SEGURANÇA
# ===========================================

# Tempo de expiração do token (em segundos)
TOKEN_EXPIRATION=3600

# Chave para criptografia de sessão
SESSION_SECRET=your-session-secret-here

# ===========================================
# CONFIGURAÇÕES DE BANCO DE DADOS (OPCIONAL)
# ===========================================

# URL de conexão com MongoDB
MONGODB_URI=mongodb://localhost:27017/paygator

# URL de conexão com Redis (para cache e rate limiting)
REDIS_URL=redis://localhost:6379

# ===========================================
# CONFIGURAÇÕES DE EMAIL (OPCIONAL)
# ===========================================

# Servidor SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# ===========================================
# CONFIGURAÇÕES DE MONITORAMENTO (OPCIONAL)
# ===========================================

# URL do Sentry para monitoramento de erros
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Chave da API do New Relic
NEW_RELIC_LICENSE_KEY=your-new-relic-key

# ===========================================
# CONFIGURAÇÕES DE CORS
# ===========================================

# Origens permitidas para CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# ===========================================
# CONFIGURAÇÕES DE SWAGGER
# ===========================================

# Título da documentação Swagger
SWAGGER_TITLE=Paygator API

# Descrição da API
SWAGGER_DESCRIPTION=API REST para integração de webhooks de provedores de pagamento

# Versão da API
SWAGGER_VERSION=1.0.0

# ===========================================
# CONFIGURAÇÕES DE TESTE
# ===========================================

# Chave de API para testes
TEST_API_KEY=test_api_key_123

# Chave de API Playfood para testes
TEST_PLAYFOOD_API_KEY=test_playfood_key_456

# ===========================================
# INSTRUÇÕES DE USO
# ===========================================

# 1. Copie este arquivo para .env
#    cp env.example .env

# 2. Gere novas chaves de API
#    npm run generate-keys

# 3. Substitua as chaves no arquivo .env

# 4. Configure as variáveis no Postman
#    - baseUrl: http://localhost:3000
#    - apiKey: [sua-chave-principal]
#    - playfoodApiKey: [sua-chave-playfood]

# 5. Inicie o servidor
#    npm run dev

# ===========================================
# NOTAS IMPORTANTES
# ===========================================

# - Nunca commite o arquivo .env no Git
# - Mantenha as chaves seguras
# - Use chaves diferentes para cada ambiente
# - Rotacione as chaves periodicamente
# - Faça backup das chaves em local seguro 
   E2PAYMENTS_CLIENT_ID=a0d56dbb-91e4-4cfd-8014-d2e347e9a0b5
   E2PAYMENTS_CLIENT_SECRET=sKjyOLNijrhALhfKwUZ29byTehBz7KR6ASi3hqj6
   E2PAYMENTS_API_URL=https://mpesaemolatech.com
   E2PAYMENTS_EMOLA_WALLET=993571

   THECODE_CLIENT_ID=a0d56dbb-91e4-4cfd-8014-d2e347e9a0b5
   THECODE_CLIENT_SECRET=sKjyOLNijrhALhfKwUZ29byTehBz7KR6ASi3hqj6
   THECODE_MPESA_WALLET=993570
E2PAYMENTS_AUTH_URL=https://mpesaemolatech.com
