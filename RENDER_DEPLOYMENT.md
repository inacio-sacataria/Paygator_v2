# 🚀 Deploy no Render - Paygator API

Este guia explica como fazer o deploy da Paygator API no Render.

## 📋 Pré-requisitos

- Conta no Render
- Projeto Supabase configurado
- Código fonte no GitHub

## 🔧 Configuração no Render

### 1. Criar novo Web Service

1. Acesse o [Render Dashboard](https://dashboard.render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Selecione o repositório do Paygator

### 2. Configurações do Serviço

**Nome:** `paygator-api` (ou o nome que preferir)

**Runtime:** `Node`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Port:** `3000`

### 3. Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente no Render:

#### Configurações Básicas
```
NODE_ENV=production
PORT=3000
API_VERSION=v1
```

#### Segurança
```
WEBHOOK_SECRET=1a02aa5907a7bc447b392f07548cf2a0f7713be742787327e4c4302c6960ee24
API_KEY=main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e
PLAYFOOD_API_KEY=playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5
JWT_SECRET=default-jwt-secret
SESSION_SECRET=paygator-secret
ADMIN_PASSWORD=admin123
```

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://yrnaggnrbgetralcevqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybmFnZ25yYmdldHJhbGNldnFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NjExNjYsImV4cCI6MjA2NDQzNzE2Nn0.H7JdfyRK1-AFH0fn_rKa5nE2GurqH9O38JXBHXuyJyQ
SUPABASE_HOST=db.llrcdfutvjrrccgytbjh.supabase.co
SUPABASE_PORT=5432
SUPABASE_DATABASE=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=.7K8.PfQWJH@#-d
DATABASE_URL=postgresql://postgres:.7K8.PfQWJH@#-d@db.llrcdfutvjrrccgytbjh.supabase.co:5432/postgres
```

#### Logging e Monitoramento
```
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log
ENABLE_METRICS=false
```

#### CORS Configuration
```
ALLOWED_ORIGINS=https://your-frontend-domain.com
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=Content-Type,Authorization,X-API-Key,X-Webhook-Signature
```

## 🔍 Solução de Problemas

### Erro de Conexão com Banco de Dados

Se você encontrar erros como `ENETUNREACH` ou problemas de conectividade:

1. **Verifique as variáveis de ambiente:**
   - Certifique-se de que todas as variáveis do Supabase estão configuradas
   - Verifique se a senha está correta

2. **Teste a conexão localmente:**
   ```bash
   npm run test-db
   ```

3. **Verifique o firewall do Supabase:**
   - Acesse o dashboard do Supabase
   - Vá em Settings → Database
   - Verifique se o IP do Render está na lista de IPs permitidos

4. **Use connection pooling (recomendado):**
   - Configure o Supabase para usar connection pooling
   - Atualize a URL de conexão para usar o pool

### Erro de Build

Se o build falhar:

1. **Verifique o Node.js version:**
   - Certifique-se de que está usando Node.js 18+
   - Adicione `"node": ">=18.0.0"` no package.json

2. **Verifique as dependências:**
   ```bash
   npm install
   npm run build
   ```

### Erro de Runtime

Se o aplicativo falhar ao iniciar:

1. **Verifique os logs:**
   - Acesse os logs no dashboard do Render
   - Procure por erros específicos

2. **Teste localmente:**
   ```bash
   npm run build
   npm start
   ```

## 📊 Monitoramento

### Health Check

O aplicativo expõe um endpoint de health check:

```
GET https://your-app.onrender.com/health
```

### Logs

Os logs são salvos em:
- Console (stdout/stderr)
- Arquivo: `logs/app.log`

### Métricas

Para habilitar métricas:
```
ENABLE_METRICS=true
METRICS_PORT=9090
```

## 🔐 Segurança

### Recomendações

1. **Rotacione as chaves regularmente**
2. **Use HTTPS sempre**
3. **Configure rate limiting**
4. **Monitore os logs**
5. **Faça backup regular dos dados**

### Variáveis Sensíveis

Nunca commite as seguintes variáveis no código:
- `SUPABASE_PASSWORD`
- `WEBHOOK_SECRET`
- `API_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`

## 🚀 Deploy Automático

O Render oferece deploy automático:

1. **Push para main:** Deploy automático
2. **Pull Requests:** Preview deployments
3. **Rollback:** Disponível no dashboard

## 📞 Suporte

Se você encontrar problemas:

1. Verifique os logs no Render
2. Teste localmente com `npm run test-db`
3. Verifique a documentação do Supabase
4. Abra uma issue no GitHub

## 🔗 Links Úteis

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/) 