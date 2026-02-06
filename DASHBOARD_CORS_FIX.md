# 🔧 Correção: Failed to fetch no Dashboard Vercel

## 🐛 Problema

O dashboard no Vercel está retornando erro "Failed to fetch" ao tentar se comunicar com a API.

## 🔍 Causa

O CORS no backend não está permitindo requisições do domínio do Vercel.

## ✅ Solução

### 1. Adicionar URL do Vercel no CORS do Backend

No **Render** (onde está a API), vá em **Environment Variables** e atualize:

**Key:** `ALLOWED_ORIGINS`

**Value:** Adicione a URL do seu dashboard Vercel. Exemplo:

```
https://paygator-v2.onrender.com,https://paygator-dashboard.vercel.app,https://paygator-dashboard-*.vercel.app,http://localhost:3000,http://localhost:3001
```

**Importante:** 
- Substitua `paygator-dashboard.vercel.app` pela URL real do seu dashboard no Vercel
- O Vercel usa wildcards (`*`) para preview deployments, então inclua `https://paygator-dashboard-*.vercel.app`

### 2. Verificar Variável VITE_API_URL no Vercel

No **Vercel**, vá em **Settings** → **Environment Variables** e verifique:

**Key:** `VITE_API_URL`

**Value:** `https://paygator-v2.onrender.com` (ou a URL real da sua API)

### 3. Verificar se a API está rodando

Teste se a API está acessível:

```bash
curl https://paygator-v2.onrender.com/health
```

Ou acesse no navegador: `https://paygator-v2.onrender.com/health`

### 4. Verificar Headers CORS

O backend precisa incluir `X-Requested-With` nos headers permitidos:

**No Render, atualize:**

**Key:** `ALLOWED_HEADERS`

**Value:**
```
Content-Type,Authorization,X-API-Key,X-Webhook-Signature,X-Requested-With
```

## 📋 Checklist

- [ ] URL do Vercel adicionada em `ALLOWED_ORIGINS` no Render
- [ ] `X-Requested-With` adicionado em `ALLOWED_HEADERS` no Render
- [ ] `VITE_API_URL` configurada corretamente no Vercel
- [ ] API está acessível e rodando
- [ ] Reiniciar o serviço no Render após alterar variáveis

## 🔄 Após Fazer as Alterações

1. **No Render:**
   - Salve as variáveis de ambiente
   - O serviço será reiniciado automaticamente
   - Aguarde alguns minutos

2. **No Vercel:**
   - Se alterou `VITE_API_URL`, faça um novo deploy
   - Ou aguarde o próximo deploy automático

3. **Teste:**
   - Acesse o dashboard no Vercel
   - Abra o Console do navegador (F12)
   - Tente fazer login
   - Verifique se não há mais erros de CORS

## 🐛 Troubleshooting Adicional

### Erro persiste após configurar CORS

1. **Verifique a URL exata do dashboard:**
   - No Vercel, vá em **Settings** → **Domains**
   - Copie a URL exata (pode ser `*.vercel.app` ou um domínio customizado)

2. **Teste CORS manualmente:**
   ```bash
   curl -H "Origin: https://seu-dashboard.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://paygator-v2.onrender.com/admin/login
   ```

3. **Verifique os logs do backend:**
   - No Render, vá em **Logs**
   - Procure por erros de CORS ou requisições bloqueadas

### Erro: "Network Error" ou "Connection Refused"

- Verifique se a API está rodando no Render
- Verifique se a URL da API está correta
- Teste acessar a API diretamente no navegador

### Erro: "401 Unauthorized" ou "403 Forbidden"

- Isso é diferente de CORS - é um problema de autenticação
- Verifique se as credenciais estão corretas
- Verifique se as rotas `/admin/*` estão acessíveis

## 📝 Exemplo de Configuração Completa

### No Render (API Backend):

```
ALLOWED_ORIGINS=https://paygator-v2.onrender.com,https://paygator-dashboard.vercel.app,https://paygator-dashboard-*.vercel.app,http://localhost:3000,http://localhost:3001

ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS

ALLOWED_HEADERS=Content-Type,Authorization,X-API-Key,X-Webhook-Signature,X-Requested-With
```

### No Vercel (Dashboard):

```
VITE_API_URL=https://paygator-v2.onrender.com
```

## 🎯 Próximos Passos

Após configurar o CORS:

1. Aguarde o restart do serviço no Render (1-2 minutos)
2. Faça um novo deploy no Vercel (ou aguarde o automático)
3. Teste o dashboard novamente
4. Se ainda não funcionar, verifique os logs no Console do navegador

