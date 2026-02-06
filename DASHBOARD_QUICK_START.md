# ⚡ Quick Start - Hospedar Dashboard

Guia rápido para hospedar o dashboard em 5 minutos.

## 🎯 Opção Mais Rápida: Render

### 1. Preparar o Build Localmente (Teste)

```bash
cd dashboard
npm install
npm run build
npm run preview  # Testa localmente em http://localhost:4173
```

### 2. Deploy no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New +"** → **"Static Site"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** `paygator-dashboard`
   - **Build Command:** `cd dashboard && npm install && npm run build`
   - **Publish Directory:** `dashboard/dist`
5. Adicione variável de ambiente:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://paygator-api.onrender.com` (sua URL da API)
6. Clique em **"Create Static Site"**

### 3. Configurar CORS no Backend

No Render, vá para o serviço `paygator-api` → **Environment** e atualize:

```
ALLOWED_ORIGINS=https://paygator-api.onrender.com,https://paygator-dashboard.onrender.com,http://localhost:3000,http://localhost:3001
```

### 4. Pronto! 🎉

Seu dashboard estará disponível em: `https://paygator-dashboard.onrender.com`

---

## 🚀 Alternativa: Vercel (Ainda Mais Rápido)

### 1. Deploy via Dashboard

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New Project"**
3. Importe seu repositório
4. Configure:
   - **Root Directory:** `dashboard`
   - **Framework Preset:** Vite
5. Adicione variável:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://paygator-api.onrender.com`
6. Clique em **"Deploy"**

### 2. Pronto! 🎉

Seu dashboard estará disponível em: `https://paygator-dashboard.vercel.app`

---

## ✅ Checklist

- [ ] Dashboard buildado localmente (`npm run build`)
- [ ] Variável `VITE_API_URL` configurada
- [ ] CORS configurado no backend
- [ ] Dashboard acessível via URL
- [ ] Requisições para API funcionando

---

## 🐛 Problemas Comuns

### "Failed to fetch"
- Verifique se `VITE_API_URL` está correto
- Verifique CORS no backend

### "404" ao navegar diretamente
- Configure redirects/rewrites (já incluído nos arquivos de config)

### Build falha
- Execute `npm install` no diretório `dashboard`
- Verifique os logs de build

---

## 📚 Documentação Completa

Veja `DASHBOARD_HOSTING_GUIDE.md` para opções detalhadas e troubleshooting.

