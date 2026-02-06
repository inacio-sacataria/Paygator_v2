# ⚡ Correção Rápida - Erro de Build no Vercel

## 🐛 Erro

```
sh: line 1: cd: dashboard: No such file or directory
Error: Command "cd dashboard && npm install" exited with 1
```

## ✅ Solução (2 minutos)

### 1. No Dashboard do Vercel

1. Vá para o seu projeto no Vercel
2. Clique em **Settings** (Configurações)
3. Role até **General**
4. Encontre **Root Directory**
5. Clique em **Edit**
6. Digite: `dashboard`
7. Clique em **Save**

### 2. Environment Variables

Certifique-se de ter:
- **Key:** `VITE_API_URL`
- **Value:** `https://paygator-v2.onrender.com`

### 3. Deploy

- Faça um novo deploy ou aguarde o deploy automático

## ✅ Pronto!

O build agora deve funcionar. O Vercel vai:
1. Entrar no diretório `dashboard`
2. Executar `npm install`
3. Executar `npm run build`
4. Servir os arquivos de `dashboard/dist`

---

## 📝 O que foi feito

- ✅ Removido `vercel.json` da raiz (estava causando conflito)
- ✅ Mantido `dashboard/vercel.json` (já está correto)
- ✅ Agora você só precisa configurar Root Directory = `dashboard`

---

## ❓ Ainda não funciona?

1. Verifique se o Root Directory está configurado como `dashboard`
2. Verifique os logs de build no Vercel
3. Teste localmente: `cd dashboard && npm run build`

