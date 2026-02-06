# 🔍 Troubleshooting: Dashboard no Vercel

## ⚠️ Erros de Extensões do Navegador

Se você ver erros como:

```
Error in event handler: Error: Called encrypt() without a session key
chrome-extension://...
```

**Isso NÃO é um problema do dashboard!** São erros de extensões do Chrome (gerenciadores de senhas, etc.) tentando interagir com a página. Você pode ignorá-los.

## ✅ Como Verificar se o Dashboard Está Funcionando

### 1. Abra o Console do Navegador

1. Acesse o dashboard no Vercel
2. Pressione `F12` ou `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Vá na aba **Console**

### 2. Filtre Erros Relevantes

No console, você verá vários tipos de erros:

- ❌ **Erros de extensões** (chrome-extension://) - **IGNORE**
- ❌ **Erros do dashboard** (AuthContext, api.ts, etc.) - **CORRIJA**

### 3. Procure por Erros Reais

Erros que você DEVE corrigir:

```
❌ Failed to fetch
❌ CORS error
❌ 401 Unauthorized
❌ 403 Forbidden
❌ Network Error
❌ TypeError: Cannot read property...
```

## 🔧 Problemas Comuns e Soluções

### 1. "Failed to fetch" ou "Network Error"

**Causa:** CORS não configurado ou API inacessível

**Solução:**
- Verifique se a URL do Vercel está em `ALLOWED_ORIGINS` no Render
- Verifique se `VITE_API_URL` está configurada no Vercel
- Veja `CORRIGIR_CORS_VERCEL.md` para mais detalhes

### 2. "401 Unauthorized" no Login

**Causa:** Senha incorreta ou problema de autenticação

**Solução:**
- Verifique se está usando a senha correta (padrão: `admin123`)
- Verifique se a rota `/admin/login` está acessível
- Verifique os logs do backend no Render

### 3. Dashboard não carrega dados

**Causa:** API não está respondendo ou CORS bloqueando

**Solução:**
- Abra a aba **Network** no DevTools
- Procure por requisições falhadas
- Verifique se a API está rodando: `https://paygator-v2.onrender.com/health`

### 4. Página em branco

**Causa:** Erro de JavaScript não tratado

**Solução:**
- Abra o Console e procure por erros em vermelho
- Verifique se `VITE_API_URL` está configurada
- Verifique se o build foi bem-sucedido no Vercel

## 🧪 Teste Passo a Passo

### 1. Verificar se a API está acessível

Abra no navegador:
```
https://paygator-v2.onrender.com/health
```

Deve retornar algo como:
```json
{"status":"ok"}
```

### 2. Verificar CORS

No Console do navegador, execute:

```javascript
fetch('https://paygator-v2.onrender.com/admin/api/auth/check', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

Se der erro de CORS, você precisa adicionar a URL do Vercel em `ALLOWED_ORIGINS`.

### 3. Verificar Variáveis de Ambiente

No Console do navegador, execute:

```javascript
console.log('API URL:', import.meta.env.VITE_API_URL)
```

Deve mostrar a URL da API (ex: `https://paygator-v2.onrender.com`)

Se mostrar `undefined`, a variável não está configurada no Vercel.

## 📋 Checklist de Verificação

- [ ] API está acessível (`/health` retorna OK)
- [ ] CORS configurado (URL do Vercel em `ALLOWED_ORIGINS`)
- [ ] `VITE_API_URL` configurada no Vercel
- [ ] `X-Requested-With` em `ALLOWED_HEADERS`
- [ ] Build do Vercel foi bem-sucedido
- [ ] Sem erros reais no Console (ignorar extensões)

## 🎯 Erros que Você Pode Ignorar

Estes erros são de extensões do navegador e NÃO afetam o dashboard:

- ✅ `chrome-extension://...`
- ✅ `Error in event handler`
- ✅ `Called encrypt() without a session key`
- ✅ `Attempting to use a disconnected port object`
- ✅ Erros de extensões de gerenciadores de senhas

## 🆘 Se Nada Funcionar

1. **Limpe o cache do navegador:**
   - `Ctrl+Shift+Delete` (Windows) / `Cmd+Shift+Delete` (Mac)
   - Selecione "Imagens e arquivos em cache"
   - Clique em "Limpar dados"

2. **Teste em modo anônimo:**
   - `Ctrl+Shift+N` (Chrome) / `Ctrl+Shift+P` (Firefox)
   - Acesse o dashboard novamente

3. **Desabilite extensões temporariamente:**
   - Vá em `chrome://extensions/`
   - Desabilite todas as extensões
   - Teste novamente

4. **Verifique os logs do Vercel:**
   - No Vercel, vá em **Deployments**
   - Clique no último deployment
   - Veja os **Build Logs** e **Function Logs**

5. **Verifique os logs do Render:**
   - No Render, vá em **Logs**
   - Procure por erros relacionados a CORS ou autenticação

