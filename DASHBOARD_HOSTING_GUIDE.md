# 🚀 Guia de Hospedagem do Dashboard Paygator

Este guia explica como hospedar o dashboard React do Paygator em diferentes plataformas.

## 📋 Pré-requisitos

- Dashboard construído (`npm run build`)
- URL da API backend configurada
- Conta na plataforma de hospedagem escolhida

## 🎯 Opções de Hospedagem

### 1. Render (Recomendado - Gratuito)

O Render oferece hospedagem gratuita para sites estáticos.

#### Passo a Passo:

1. **Preparar o Build**
   ```bash
   cd dashboard
   npm install
   npm run build
   ```

2. **Criar Arquivo de Configuração**
   
   Crie um arquivo `render.yaml` na raiz do projeto (ou use o existente):
   ```yaml
   services:
     - type: web
       name: paygator-dashboard
       env: static
       buildCommand: cd dashboard && npm install && npm run build
       staticPublishPath: dashboard/dist
       envVars:
         - key: VITE_API_URL
           value: https://paygator-api.onrender.com
   ```

3. **Deploy no Render**
   - Acesse [Render Dashboard](https://dashboard.render.com)
   - Clique em "New +" → "Static Site"
   - Conecte seu repositório GitHub
   - Configure:
     - **Name:** `paygator-dashboard`
     - **Build Command:** `cd dashboard && npm install && npm run build`
     - **Publish Directory:** `dashboard/dist`
   - Adicione variável de ambiente:
     - **Key:** `VITE_API_URL`
     - **Value:** `https://paygator-api.onrender.com` (ou sua URL da API)

4. **Configurar CORS no Backend**
   
   Certifique-se de que o backend permite requisições do dashboard:
   ```
   ALLOWED_ORIGINS=https://paygator-dashboard.onrender.com,https://paygator-api.onrender.com
   ```

---

### 2. Vercel (Recomendado - Gratuito)

O Vercel oferece excelente suporte para aplicações React/Vite.

#### Passo a Passo:

1. **Instalar Vercel CLI** (opcional)
   ```bash
   npm i -g vercel
   ```

2. **Configurar Projeto**
   
   Crie `vercel.json` na raiz do projeto:
   ```json
   {
     "builds": [
       {
         "src": "dashboard/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/dashboard/dist/$1"
       }
     ]
   }
   ```

   Ou configure diretamente no dashboard:
   
   Crie `dashboard/vercel.json`:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

3. **Deploy via Dashboard**
   - Acesse [Vercel Dashboard](https://vercel.com/dashboard)
   - Clique em "Add New" → "Project"
   - Importe seu repositório GitHub
   - Configure:
     - **Root Directory:** `dashboard`
     - **Framework Preset:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
   - Adicione variável de ambiente:
     - **Key:** `VITE_API_URL`
     - **Value:** `https://paygator-api.onrender.com`

4. **Deploy via CLI**
   ```bash
   cd dashboard
   vercel
   ```

---

### 3. Netlify (Gratuito)

#### Passo a Passo:

1. **Criar Arquivo de Configuração**
   
   Crie `dashboard/netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy no Netlify**
   - Acesse [Netlify Dashboard](https://app.netlify.com)
   - Clique em "Add new site" → "Import an existing project"
   - Conecte seu repositório GitHub
   - Configure:
     - **Base directory:** `dashboard`
     - **Build command:** `npm run build`
     - **Publish directory:** `dashboard/dist`
   - Adicione variável de ambiente:
     - **Key:** `VITE_API_URL`
     - **Value:** `https://paygator-api.onrender.com`

---

### 4. GitHub Pages (Gratuito)

#### Passo a Passo:

1. **Configurar Vite para GitHub Pages**
   
   Edite `dashboard/vite.config.ts`:
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     base: '/Paygator_v2/', // Nome do seu repositório
     build: {
       outDir: 'dist',
     }
   })
   ```

2. **Criar GitHub Action**
   
   Crie `.github/workflows/deploy-dashboard.yml`:
   ```yaml
   name: Deploy Dashboard
   
   on:
     push:
       branches: [ main ]
       paths:
         - 'dashboard/**'
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'
             cache-dependency-path: dashboard/package-lock.json
         
         - name: Install dependencies
           run: |
             cd dashboard
             npm ci
         
         - name: Build
           run: |
             cd dashboard
             npm run build
           env:
             VITE_API_URL: ${{ secrets.VITE_API_URL }}
         
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dashboard/dist
   ```

3. **Configurar Secrets**
   - Vá em Settings → Secrets and variables → Actions
   - Adicione `VITE_API_URL` com a URL da sua API

---

### 5. Servir junto com a API (Render/Vercel)

Você pode servir o dashboard como arquivos estáticos através da própria API.

#### Passo a Passo:

1. **Construir o Dashboard**
   ```bash
   cd dashboard
   npm run build
   ```

2. **Copiar arquivos para a API**
   ```bash
   # No Windows PowerShell
   Copy-Item -Path "dashboard\dist\*" -Destination "public\dashboard\" -Recurse -Force
   ```

3. **Configurar Rota na API**
   
   Adicione no `src/app.ts`:
   ```typescript
   // Servir dashboard estático
   app.use('/dashboard', express.static(path.join(__dirname, '../public/dashboard')));
   
   // Fallback para SPA
   app.get('/dashboard/*', (req, res) => {
     res.sendFile(path.join(__dirname, '../public/dashboard/index.html'));
   });
   ```

4. **Acessar**
   - Dashboard: `https://paygator-api.onrender.com/dashboard`
   - API: `https://paygator-api.onrender.com/api`

---

## 🔧 Configuração de Variáveis de Ambiente

### Variáveis Necessárias

O dashboard precisa da seguinte variável:

- `VITE_API_URL`: URL completa da API backend
  - Exemplo: `https://paygator-api.onrender.com`
  - **Importante:** Não inclua barra no final

### Configuração por Plataforma

#### Render
- Vá em Settings → Environment
- Adicione: `VITE_API_URL=https://paygator-api.onrender.com`

#### Vercel
- Vá em Settings → Environment Variables
- Adicione: `VITE_API_URL=https://paygator-api.onrender.com`

#### Netlify
- Vá em Site settings → Environment variables
- Adicione: `VITE_API_URL=https://paygator-api.onrender.com`

---

## 🔐 Configuração de CORS

Certifique-se de que o backend permite requisições do dashboard:

### No Backend (Render)

Adicione a URL do dashboard em `ALLOWED_ORIGINS`:

```
ALLOWED_ORIGINS=https://paygator-dashboard.onrender.com,https://paygator-api.onrender.com
```

### Verificar CORS

Teste se o CORS está funcionando:

```bash
curl -H "Origin: https://paygator-dashboard.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://paygator-api.onrender.com/admin/api/stats
```

---

## 🧪 Testar Localmente Antes do Deploy

1. **Construir o dashboard:**
   ```bash
   cd dashboard
   npm run build
   ```

2. **Servir localmente:**
   ```bash
   npm run preview
   ```

3. **Configurar variável de ambiente:**
   Crie `dashboard/.env.production`:
   ```
   VITE_API_URL=https://paygator-api.onrender.com
   ```

4. **Testar:**
   - Acesse `http://localhost:4173`
   - Verifique se as requisições para a API funcionam

---

## 🐛 Troubleshooting

### Erro: "Failed to fetch" ou CORS

**Problema:** O dashboard não consegue fazer requisições para a API.

**Solução:**
1. Verifique se `VITE_API_URL` está configurado corretamente
2. Verifique se o backend permite a origem do dashboard em CORS
3. Verifique os logs do navegador (F12 → Console)

### Erro: "404 Not Found" nas rotas

**Problema:** Ao navegar diretamente para uma rota, retorna 404.

**Solução:**
- Configure redirects/rewrites para servir `index.html` em todas as rotas
- Vercel: Use `rewrites` no `vercel.json`
- Netlify: Use `_redirects` ou `netlify.toml`
- Render: Configure no painel de configurações

### Erro: Variáveis de ambiente não funcionam

**Problema:** `VITE_API_URL` não está sendo lida.

**Solução:**
1. Variáveis do Vite devem começar com `VITE_`
2. Reinicie o servidor após alterar variáveis
3. No build de produção, as variáveis são embutidas no código

### Build falha

**Problema:** O build do dashboard falha.

**Solução:**
1. Verifique se todas as dependências estão instaladas
2. Execute `npm install` no diretório `dashboard`
3. Verifique os logs de build para erros específicos

---

## 📊 Comparação de Plataformas

| Plataforma | Gratuito | Build Automático | CDN | Fácil Configuração |
|------------|----------|------------------|-----|-------------------|
| Render     | ✅ Sim   | ✅ Sim           | ✅  | ⭐⭐⭐⭐          |
| Vercel     | ✅ Sim   | ✅ Sim           | ✅  | ⭐⭐⭐⭐⭐         |
| Netlify    | ✅ Sim   | ✅ Sim           | ✅  | ⭐⭐⭐⭐          |
| GitHub Pages | ✅ Sim | ✅ Sim (Actions) | ✅  | ⭐⭐⭐            |

---

## 🚀 Recomendação Final

Para este projeto, recomendo:

1. **Vercel** - Melhor experiência e suporte para Vite
2. **Render** - Se já estiver usando para a API
3. **Netlify** - Alternativa sólida

---

## 📞 Próximos Passos

1. Escolha uma plataforma
2. Configure as variáveis de ambiente
3. Faça o deploy
4. Configure CORS no backend
5. Teste o dashboard em produção

---

## 🔗 Links Úteis

- [Render Static Sites](https://render.com/docs/static-sites)
- [Vercel Vite Guide](https://vercel.com/docs/frameworks/vite)
- [Netlify Vite Guide](https://docs.netlify.com/integrations/frameworks/vite/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

