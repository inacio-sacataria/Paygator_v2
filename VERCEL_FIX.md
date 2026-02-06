# 🔧 Correção do Erro de Build no Vercel

## 🐛 Problema

O Vercel estava tentando executar `cd dashboard && npm install`, mas o diretório não era encontrado porque o contexto do build não estava correto.

## ✅ Solução: Configurar Root Directory

A **melhor solução** é configurar o **Root Directory** no dashboard do Vercel:

### Passo a Passo:

1. **No Dashboard do Vercel:**
   - Vá para o seu projeto
   - Clique em **Settings**
   - Role até **General**
   - Encontre **Root Directory**
   - Clique em **Edit**
   - Digite: `dashboard`
   - Clique em **Save**

2. **Build Settings:**
   - **Framework Preset:** `Vite` (ou deixe auto-detect)
   - **Build Command:** (deixe vazio - será `npm run build` automaticamente)
   - **Output Directory:** `dist`
   - **Install Command:** (deixe vazio - será `npm install` automaticamente)

3. **Environment Variables:**
   - Adicione: `VITE_API_URL = https://paygator-v2.onrender.com`

4. **Deploy:**
   - Faça um novo deploy ou aguarde o deploy automático

---

## ✅ Solução Aplicada

O `vercel.json` da raiz foi **removido**. Agora você deve:

1. **Configurar o Root Directory** no dashboard do Vercel como `dashboard`
2. O Vercel usará automaticamente o `dashboard/vercel.json` que já existe
3. Não precisa configurar nada manualmente - o `dashboard/vercel.json` já tem tudo configurado

---

## 📝 O que foi alterado

O `vercel.json` na raiz foi atualizado para funcionar **quando o Root Directory está configurado como `dashboard`**:

```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
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

**Nota:** Este arquivo só funciona se o Root Directory estiver configurado como `dashboard` no Vercel.

---

## ✅ Checklist

- [ ] Root Directory configurado como `dashboard` no Vercel
- [ ] Build Command: (vazio ou `npm run build`)
- [ ] Output Directory: `dist`
- [ ] Variável `VITE_API_URL` configurada
- [ ] Deploy executado

---

## 🎯 Recomendação Final

**Use a primeira opção (Root Directory = dashboard)** - é mais simples e funciona melhor com o Vercel.

