# ⚡ Solução Rápida: Failed to fetch no Vercel

## 🎯 O Que Fazer AGORA

### 1. No Render (API Backend)

Vá em **Environment Variables** e atualize:

**`ALLOWED_ORIGINS`** - Adicione a URL do seu dashboard Vercel:

```
https://paygator-v2.onrender.com,https://SEU-DASHBOARD.vercel.app,https://SEU-DASHBOARD-*.vercel.app,http://localhost:3000,http://localhost:3001
```

**Substitua `SEU-DASHBOARD` pela URL real do seu dashboard no Vercel!**

**`ALLOWED_HEADERS`** - Adicione `X-Requested-With`:

```
Content-Type,Authorization,X-API-Key,X-Webhook-Signature,X-Requested-With
```

### 2. No Vercel (Dashboard)

Verifique se `VITE_API_URL` está configurada:

**Key:** `VITE_API_URL`  
**Value:** `https://paygator-v2.onrender.com`

### 3. Aguarde e Teste

- Aguarde 1-2 minutos (Render reinicia automaticamente)
- Teste o dashboard novamente

## 🔍 Como Descobrir a URL do Dashboard Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique no projeto do dashboard
3. A URL aparece no topo ou em **Settings** → **Domains**
4. Exemplo: `https://paygator-dashboard.vercel.app`

## ✅ Pronto!

Após essas alterações, o erro "Failed to fetch" deve desaparecer.

