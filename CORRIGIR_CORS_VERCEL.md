# 🚨 CORREÇÃO URGENTE: CORS para Dashboard Vercel

## ⚠️ Problema Atual

O dashboard no Vercel não consegue se comunicar com a API porque o CORS não permite requisições do domínio do Vercel.

## ✅ Solução Rápida

### Passo 1: Descobrir a URL do seu Dashboard no Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique no seu projeto do dashboard
3. Vá em **Settings** → **Domains**
4. Copie a URL (exemplo: `https://paygator-dashboard.vercel.app` ou um domínio customizado)

### Passo 2: Atualizar CORS no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Vá no serviço `paygator-api` (ou `paygator-v2`)
3. Clique em **Environment**
4. Encontre a variável `ALLOWED_ORIGINS`
5. Clique em **Edit**
6. Adicione a URL do Vercel. Exemplo:

**ANTES:**
```
https://paygator-api.onrender.com,https://paygator-dashboard.onrender.com,http://localhost:3000,http://localhost:3001
```

**DEPOIS (adicione a URL do Vercel):**
```
https://paygator-v2.onrender.com,https://paygator-dashboard.vercel.app,https://paygator-dashboard-*.vercel.app,http://localhost:3000,http://localhost:3001
```

**⚠️ IMPORTANTE:** 
- Substitua `paygator-dashboard.vercel.app` pela URL REAL do seu dashboard
- Inclua também `https://paygator-dashboard-*.vercel.app` para preview deployments

### Passo 3: Adicionar X-Requested-With nos Headers

1. No mesmo painel do Render, encontre `ALLOWED_HEADERS`
2. Certifique-se de que contém `X-Requested-With`:

```
Content-Type,Authorization,X-API-Key,X-Webhook-Signature,X-Requested-With
```

### Passo 4: Salvar e Aguardar

1. Clique em **Save Changes**
2. O Render vai reiniciar o serviço automaticamente
3. Aguarde 1-2 minutos

### Passo 5: Verificar VITE_API_URL no Vercel

1. No Vercel, vá em **Settings** → **Environment Variables**
2. Verifique se `VITE_API_URL` está configurada:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://paygator-v2.onrender.com` (ou a URL real da sua API)

## 🧪 Teste

Após fazer as alterações:

1. Aguarde 1-2 minutos para o Render reiniciar
2. Acesse o dashboard no Vercel
3. Abra o Console do navegador (F12)
4. Tente fazer login
5. Verifique se não há mais erros de "Failed to fetch"

## 📋 Resumo das URLs Necessárias

Você precisa adicionar no `ALLOWED_ORIGINS` do Render:

- ✅ URL da API (já deve estar)
- ✅ URL do Dashboard Vercel (exemplo: `https://paygator-dashboard.vercel.app`)
- ✅ URL do Dashboard Vercel com wildcard (exemplo: `https://paygator-dashboard-*.vercel.app`)
- ✅ localhost (para desenvolvimento)

## 🔍 Como Verificar se Funcionou

1. Abra o Console do navegador (F12)
2. Vá na aba **Network**
3. Tente fazer login
4. Procure por requisições para `/admin/login` ou `/admin/api/auth/check`
5. Se aparecer erro de CORS, verifique se a URL está correta em `ALLOWED_ORIGINS`

## 🆘 Se Ainda Não Funcionar

1. **Verifique a URL exata:**
   - No Vercel: Settings → Domains
   - Copie a URL exata (pode ter subdomínio diferente)

2. **Teste a API diretamente:**
   ```bash
   curl https://paygator-v2.onrender.com/health
   ```

3. **Verifique os logs:**
   - No Render: vá em Logs
   - Procure por erros de CORS

4. **Verifique se a API está rodando:**
   - Acesse `https://paygator-v2.onrender.com/health` no navegador

