# 🔑 Guia de Chaves de API - Paygator

Este guia explica como gerar, configurar e usar chaves de API no sistema Paygator.

## 📋 Índice

- [Tipos de Chaves](#tipos-de-chaves)
- [Como Gerar Chaves](#como-gerar-chaves)
- [Configuração](#configuração)
- [Uso no Postman](#uso-no-postman)
- [Segurança](#segurança)
- [Troubleshooting](#troubleshooting)

## 🔐 Tipos de Chaves

### 1. **Main API Key**
- **Formato:** `main_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Uso:** Autenticação principal da API
- **Endpoints:** Todos os endpoints principais
- **Comprimento:** 32 caracteres hex

### 2. **Playfood API Key**
- **Formato:** `playfood_xxxxxxxxxxxxxxxxxxxxxxxx`
- **Uso:** Autenticação específica para endpoints Playfood
- **Endpoints:** `/api/v1/playfood/*`
- **Comprimento:** 24 caracteres hex

### 3. **Webhook Secret**
- **Formato:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Uso:** Assinatura de webhooks para segurança
- **Comprimento:** 32-64 caracteres hex

## 🚀 Como Gerar Chaves

### Método 1: Script NPM (Recomendado)

```bash
# Gerar todas as chaves para todos os ambientes
npm run generate-keys

# Ou usando o alias
npm run keys
```

### Método 2: Script Direto

```bash
# Executar o script diretamente
node scripts/generate-keys.js
```

### Método 3: TypeScript (Desenvolvimento)

```typescript
import { KeyGenerator } from './src/utils/keyGenerator';

// Gerar chave principal
const mainKey = KeyGenerator.generateMainApiKey();
console.log(mainKey); // main_abc123def456...

// Gerar chave Playfood
const playfoodKey = KeyGenerator.generatePlayfoodApiKey();
console.log(playfoodKey); // playfood_abc123def456...

// Gerar secret para webhook
const webhookSecret = KeyGenerator.generateWebhookSecret();
console.log(webhookSecret); // abc123def456...
```

### Método 4: Linha de Comando Manual

```bash
# Gerar chave principal (32 bytes)
openssl rand -hex 32 | sed 's/^/main_/'

# Gerar chave Playfood (24 bytes)
openssl rand -hex 24 | sed 's/^/playfood_/'

# Gerar webhook secret (64 bytes)
openssl rand -hex 64
```

## ⚙️ Configuração

### 1. Arquivo .env

Crie ou atualize seu arquivo `.env`:

```env
# Ambiente
NODE_ENV=development

# Chaves de API
API_KEY=main_abc123def45678901234567890123456
PLAYFOOD_API_KEY=playfood_abc123def4567890123456

# Webhook Secrets
WEBHOOK_SECRET=abc123def4567890123456789012345678901234567890123456789012345678

# Configurações do Servidor
PORT=3000
LOG_LEVEL=info
```

### 2. Variáveis de Ambiente do Sistema

#### Windows (PowerShell)
```powershell
$env:API_KEY="main_abc123def45678901234567890123456"
$env:PLAYFOOD_API_KEY="playfood_abc123def4567890123456"
$env:WEBHOOK_SECRET="abc123def4567890123456789012345678901234567890123456789012345678"
```

#### Linux/macOS
```bash
export API_KEY="main_abc123def45678901234567890123456"
export PLAYFOOD_API_KEY="playfood_abc123def4567890123456"
export WEBHOOK_SECRET="abc123def4567890123456789012345678901234567890123456789012345678"
```

### 3. Docker

```dockerfile
# Dockerfile
ENV API_KEY=main_abc123def45678901234567890123456
ENV PLAYFOOD_API_KEY=playfood_abc123def4567890123456
ENV WEBHOOK_SECRET=abc123def4567890123456789012345678901234567890123456789012345678
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  paygator-api:
    build: .
    environment:
      - API_KEY=main_abc123def45678901234567890123456
      - PLAYFOOD_API_KEY=playfood_abc123def4567890123456
      - WEBHOOK_SECRET=abc123def4567890123456789012345678901234567890123456789012345678
```

## 📮 Uso no Postman

### 1. Configurar Variáveis

1. Abra a coleção **Paygator API Collection**
2. Clique no ícone de **engrenagem** (⚙️)
3. Vá para a aba **"Variables"**
4. Configure as variáveis:

| Variável | Valor |
|----------|-------|
| `baseUrl` | `http://localhost:3000` |
| `apiKey` | `main_abc123def45678901234567890123456` |
| `playfoodApiKey` | `playfood_abc123def4567890123456` |

### 2. Testar Autenticação

```bash
# Teste com cURL
curl -X GET "http://localhost:3000/api/v1/playfood/status" \
  -H "X-API-Key: playfood_abc123def4567890123456"

# Resposta esperada
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## 🔒 Segurança

### Boas Práticas

1. **Nunca compartilhe chaves**
   - Mantenha as chaves em local seguro
   - Não commite chaves no Git
   - Use variáveis de ambiente

2. **Rotação de chaves**
   - Troque as chaves periodicamente
   - Mantenha backup das chaves antigas
   - Notifique usuários sobre mudanças

3. **Ambientes separados**
   - Use chaves diferentes para cada ambiente
   - Não use chaves de produção em desenvolvimento
   - Mantenha staging separado

4. **Monitoramento**
   - Monitore uso das chaves
   - Configure alertas para uso anormal
   - Mantenha logs de acesso

### Validação de Chaves

```typescript
import { KeyGenerator } from './src/utils/keyGenerator';

// Validar formato da chave
const isValid = KeyGenerator.isValidApiKey('main_abc123def45678901234567890123456');
console.log(isValid); // true

// Extrair prefixo
const prefix = KeyGenerator.getApiKeyPrefix('playfood_abc123def4567890123456');
console.log(prefix); // 'playfood'
```

## 🛠️ Troubleshooting

### Erro 401 - Unauthorized

**Problema:** Chave de API inválida ou ausente

**Soluções:**
1. Verifique se a chave está correta
2. Confirme se o header `X-API-Key` está presente
3. Verifique se a chave tem o formato correto
4. Confirme se a chave não expirou

```bash
# Verificar formato da chave
echo "main_abc123def45678901234567890123456" | grep -E "^[a-z]+_[a-f0-9]{16,}$"
```

### Erro 403 - Forbidden

**Problema:** Chave não tem permissão para o endpoint

**Soluções:**
1. Use a chave correta para o endpoint
2. Verifique se a chave tem as permissões necessárias
3. Confirme se está usando a chave Playfood para endpoints Playfood

### Chave não funciona no Postman

**Problema:** Variáveis não configuradas corretamente

**Soluções:**
1. Verifique se as variáveis estão definidas
2. Confirme se os nomes das variáveis estão corretos
3. Teste com valores hardcoded primeiro
4. Verifique se a coleção está usando as variáveis

### Webhook Signature Inválida

**Problema:** Assinatura do webhook não confere

**Soluções:**
1. Verifique se o secret está correto
2. Confirme se o payload está sendo assinado corretamente
3. Verifique se o algoritmo de hash está correto (SHA256)

```typescript
// Gerar assinatura de teste
const payload = JSON.stringify({ event: 'test', data: {} });
const signature = KeyGenerator.generateWebhookSignature(payload, webhookSecret);
console.log(signature); // sha256=abc123...
```

## 📝 Exemplos Práticos

### Gerar Chaves para Novo Projeto

```bash
# 1. Gerar chaves
npm run generate-keys

# 2. Copiar chaves para .env
cp .env.example .env
# Editar .env com as chaves geradas

# 3. Testar configuração
npm run dev

# 4. Testar no Postman
# Importar coleção e configurar variáveis
```

### Rotação de Chaves

```bash
# 1. Gerar novas chaves
npm run generate-keys

# 2. Atualizar .env com novas chaves
# Manter chaves antigas temporariamente

# 3. Testar com novas chaves
curl -X GET "http://localhost:3000/api/v1/playfood/status" \
  -H "X-API-Key: [nova-chave]"

# 4. Atualizar Postman
# Configurar novas variáveis

# 5. Remover chaves antigas após confirmação
```

### Backup de Chaves

```bash
# Criar backup seguro
mkdir -p ~/.paygator-keys
cp .env ~/.paygator-keys/backup-$(date +%Y%m%d).env

# Criptografar backup (opcional)
gpg -e ~/.paygator-keys/backup-$(date +%Y%m%d).env
```

## 🎯 Checklist de Configuração

- [ ] Gerar chaves para todos os ambientes
- [ ] Configurar arquivo .env
- [ ] Configurar variáveis no Postman
- [ ] Testar autenticação
- [ ] Configurar webhook secrets
- [ ] Fazer backup das chaves
- [ ] Documentar configuração
- [ ] Treinar equipe sobre segurança

---

**⚠️ Importante:** Mantenha suas chaves seguras e nunca as compartilhe publicamente! 