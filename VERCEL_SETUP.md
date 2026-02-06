# 🚀 Configuração do Vercel para o Dashboard

## ⚠️ Configuração Importante

O dashboard está em um **subdiretório** (`dashboard/`), então você precisa configurar o **Root Directory** no Vercel.

## 📋 Passo a Passo

### 1. No Dashboard do Vercel

Quando criar/editar o projeto:

1. **Root Directory:** Configure como `dashboard`
   - Vá em **Settings** → **General**
   - Role até **Root Directory**
   - Selecione `dashboard` ou digite `dashboard`

### 2. Build Settings

Configure manualmente:

- **Framework Preset:** `Vite`
- **Build Command:** `npm run build` (ou deixe vazio, o Vercel detecta automaticamente)
- **Output Directory:** `dist`
- **Install Command:** `npm install` (ou deixe vazio)

### 3. Environment Variables

Adicione:

- **Key:** `VITE_API_URL`
- **Value:** `https://paygator-v2.onrender.com`

### 4. Deploy

Clique em **Deploy** e aguarde o build.

---

## 🔧 Alternativa: Usar vercel.json na Raiz

Se preferir usar o `vercel.json` na raiz (já criado), você pode:

1. **NÃO** configurar Root Directory no dashboard do Vercel
2. O Vercel usará o `vercel.json` na raiz automaticamente
3. O build será executado com os comandos configurados

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"

**Problema:** O Vercel está tentando fazer build na raiz.

**Solução:**
- Configure **Root Directory** como `dashboard` no dashboard do Vercel
- OU use o `vercel.json` na raiz (já criado)

### Erro: TypeScript compilation failed

**Problema:** Erros de TypeScript estão impedindo o build.

**Solução:**
1. Teste localmente:
   ```bash
   cd dashboard
   npm run build
   ```
2. Corrija os erros de TypeScript
3. Faça commit e push

### Erro: "Output Directory not found"

**Problema:** O diretório de saída não está sendo encontrado.

**Solução:**
- Se Root Directory = `dashboard`, então Output Directory = `dist`
- Se Root Directory = `.` (raiz), então Output Directory = `dashboard/dist`

---

## ✅ Checklist

- [ ] Root Directory configurado como `dashboard` (ou usando vercel.json na raiz)
- [ ] Build Command: `npm run build` (ou vazio para auto-detecção)
- [ ] Output Directory: `dist` (se root = dashboard) ou `dashboard/dist` (se root = raiz)
- [ ] Variável `VITE_API_URL` configurada
- [ ] Build funciona localmente (`cd dashboard && npm run build`)
- [ ] ✅ **PROBLEMA RESOLVIDO:** Arquivo `vite-env.d.ts` criado (já incluído no projeto)

---

## 🎯 Configuração Recomendada

**No Dashboard do Vercel:**

```
Root Directory: dashboard
Framework Preset: Vite
Build Command: (deixe vazio - auto-detect)
Output Directory: dist
Install Command: (deixe vazio - auto-detect)
```

**Environment Variables:**
```
VITE_API_URL = https://paygator-v2.onrender.com
```

---

## 📞 Se ainda não funcionar

1. Verifique os logs de build no Vercel
2. Teste o build localmente:
   ```bash
   cd dashboard
   npm install
   npm run build
   ```
3. Se funcionar localmente, o problema é de configuração do Vercel
4. Se não funcionar localmente, corrija os erros primeiro

