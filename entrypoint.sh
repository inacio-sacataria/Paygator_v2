#!/bin/sh

echo "🚀 Iniciando Paygator no Render..."

# Verificar se estamos no Render
if [ -n "$RENDER" ]; then
  echo "✅ Detectado ambiente Render"
  echo "PORT: $PORT"
  echo "NODE_ENV: $NODE_ENV"
fi

# Verificar se o build existe
if [ ! -f /app/dist/index.js ]; then
  echo "❌ Build não encontrado. Executando build..."
  npm run build
fi

# Gerar API key se necessário
if [ ! -f /app/api_key.txt ]; then
  echo "🔑 Gerando nova API key..."
  node -e "const fs = require('fs'); const key = 'main_' + require('crypto').randomBytes(32).toString('hex'); fs.writeFileSync('/app/api_key.txt', key); console.log('API Key gerada:', key)"
else
  echo "🔑 API Key já gerada:"
  cat /app/api_key.txt
fi

# Criar diretório de logs se não existir
mkdir -p /app/logs

# Verificar variáveis de ambiente críticas
echo "🔧 Verificando variáveis de ambiente..."
if [ -z "$PORT" ]; then
  echo "⚠️  PORT não definida, usando 3000"
  export PORT=3000
fi

if [ -z "$NODE_ENV" ]; then
  echo "⚠️  NODE_ENV não definida, usando production"
  export NODE_ENV=production
fi

echo "🚀 Iniciando servidor na porta $PORT..."
exec npm start 