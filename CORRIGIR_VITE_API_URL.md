# 🚨 CORREÇÃO URGENTE: VITE_API_URL não configurada

## ⚠️ Problema

O dashboard em produção está tentando se conectar a `localhost:3000` em vez da URL da API de produção.

**Erro visto:**
```
POST http://localhost:3000/admin/login net::ERR_CONNECTION_REFUSED
```

## ✅ Solução

### Passo 1: Configurar Variável no Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique no projeto do dashboard
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Configure:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://paygator-v2.onrender.com` (ou a URL real da sua API)
   - **Environment:** Selecione **Production**, **Preview** e **Development**
6. Clique em **Save**

### Passo 2: Fazer Novo Deploy

**IMPORTANTE:** Após adicionar a variável, você precisa fazer um novo deploy!

1. No Vercel, vá em **Deployments**
2. Clique nos **3 pontos** do último deployment
3. Clique em **Redeploy**
4. Ou faça um novo commit e push (deploy automático)

### Passo 3: Verificar

Após o deploy:

1. Acesse o dashboard no Vercel
2. Abra o Console (F12)
3. Execute:
   ```javascript
   console.log('API URL:', import.meta.env.VITE_API_URL)
   ```
4. Deve mostrar: `https://paygator-v2.onrender.com` (não `undefined`!)

## 🔍 Como Verificar se Está Configurado

### No Console do Navegador:

```javascript
// Verificar variável
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)

// Deve mostrar a URL da API, não undefined!
```

### Na Aba Network:

Após fazer login, verifique se as requisições vão para:
- ✅ `https://paygator-v2.onrender.com/admin/login`
- ❌ `http://localhost:3000/admin/login` (ERRADO!)

## ⚠️ Importante sobre Vite

**No Vite, as variáveis de ambiente são embutidas no código durante o BUILD!**

Isso significa:
- ✅ Se você configurar a variável ANTES do build → funciona
- ❌ Se você configurar DEPOIS do build → precisa fazer novo build/deploy

## 📋 Checklist

- [ ] Variável `VITE_API_URL` configurada no Vercel
- [ ] Valor correto: `https://paygator-v2.onrender.com`
- [ ] Ambiente: Production, Preview e Development selecionados
- [ ] Novo deploy feito após configurar
- [ ] Console mostra a URL correta (não `undefined`)
- [ ] Requisições vão para a URL de produção (não localhost)

## 🐛 Se Ainda Não Funcionar

### 1. Verificar se a Variável Está no Build

No Console do navegador:
```javascript
console.log('All env vars:', import.meta.env)
```

### 2. Verificar Build Logs

No Vercel:
1. Vá em **Deployments**
2. Clique no último deployment
3. Veja os **Build Logs**
4. Procure por `VITE_API_URL`

### 3. Forçar Novo Build

1. Faça um pequeno commit (ex: adicione um espaço em um arquivo)
2. Faça push
3. Aguarde o deploy automático

### 4. Verificar se Está no Ambiente Correto

No Vercel, certifique-se de que a variável está configurada para:
- ✅ Production
- ✅ Preview  
- ✅ Development

## 🎯 Configuração Correta

**No Vercel:**

```
Key: VITE_API_URL
Value: https://paygator-v2.onrender.com
Environments: ☑ Production ☑ Preview ☑ Development
```

**Após configurar:**
- Clique em **Save**
- Faça um **Redeploy** ou novo commit
- Aguarde o build completar
- Teste novamente

