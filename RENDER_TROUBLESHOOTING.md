# 🔧 Troubleshooting do Render - Paygator

Este guia ajuda a resolver problemas comuns quando o aplicativo não responde no Render.

## 🚨 **Problemas Comuns**

### **1. Aplicativo não responde**
**Sintomas:**
- Página não carrega
- Timeout de conexão
- Erro 502/503

**Soluções:**
```bash
# 1. Verificar logs do Render
# Acesse: Dashboard do Render > Seu serviço > Logs

# 2. Executar diagnóstico local
npm run render-diagnostic

# 3. Verificar build
npm run build

# 4. Testar localmente
npm start
```

### **2. Erro de build**
**Sintomas:**
- Build falha no Render
- Erro de dependências
- Erro de TypeScript

**Soluções:**
```bash
# 1. Limpar cache
rm -rf node_modules package-lock.json
npm install

# 2. Verificar TypeScript
npm run build

# 3. Verificar dependências
npm audit fix
```

### **3. Problemas de banco de dados**
**Sintomas:**
- Erro `ENETUNREACH`
- Timeout de conexão
- Erro de autenticação

**Soluções:**
```bash
# 1. Testar conexão
npm run test-db

# 2. Verificar variáveis de ambiente no Render
# Dashboard > Environment Variables

# 3. Verificar configuração do Supabase
```

## 🔍 **Diagnóstico Passo a Passo**

### **Passo 1: Verificar Logs do Render**
1. Acesse o dashboard do Render
2. Vá para seu serviço
3. Clique em "Logs"
4. Procure por erros recentes

### **Passo 2: Verificar Variáveis de Ambiente**
No dashboard do Render, verifique se estas variáveis estão configuradas:

**Obrigatórias:**
```
PORT=3000
NODE_ENV=production
SUPABASE_HOST=db.llrcdfutvjrrccgytbjh.supabase.co
SUPABASE_PORT=5432
SUPABASE_DATABASE=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=.7K8.PfQWJH@#-d
WEBHOOK_SECRET=1a02aa5907a7bc447b392f07548cf2a0f7713be742787327e4c4302c6960ee24
API_KEY=main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e
JWT_SECRET=default-jwt-secret
SESSION_SECRET=paygator-secret
```

**Opcionais:**
```
LOG_LEVEL=info
ALLOWED_ORIGINS=*
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=Content-Type,Authorization,X-API-Key,X-Webhook-Signature
```

### **Passo 3: Executar Diagnóstico Local**
```bash
# Executar diagnóstico completo
npm run render-diagnostic

# Testar apenas banco de dados
npm run test-db

# Verificar build
npm run build
```

### **Passo 4: Verificar Configuração do Serviço**
No Render, verifique:

1. **Build Command:** `npm run build`
2. **Start Command:** `./entrypoint.sh`
3. **Environment:** `Docker`
4. **Health Check Path:** `/health`

## 🛠️ **Correções Específicas**

### **Problema: Porta incorreta**
**Solução:**
```bash
# No Render, adicione:
PORT=3000
```

### **Problema: Build falha**
**Solução:**
```bash
# Localmente, teste:
npm run build

# Se falhar, verifique:
# 1. TypeScript está instalado
# 2. Todas as dependências estão instaladas
# 3. Não há erros de sintaxe
```

### **Problema: Conexão com banco falha**
**Solução:**
```bash
# 1. Teste conexão local
npm run test-db

# 2. Verifique variáveis no Render
# 3. Confirme se o Supabase está acessível
```

### **Problema: Aplicativo não inicia**
**Solução:**
```bash
# 1. Verifique se o entrypoint.sh tem permissão
chmod +x entrypoint.sh

# 2. Teste localmente
./entrypoint.sh

# 3. Verifique logs do Render
```

## 📋 **Checklist de Deploy**

### **Antes do Deploy:**
- [ ] `npm run build` funciona localmente
- [ ] `npm start` funciona localmente
- [ ] `npm run test-db` conecta ao banco
- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] `entrypoint.sh` tem permissão de execução

### **Durante o Deploy:**
- [ ] Build é bem-sucedido
- [ ] Servidor inicia sem erros
- [ ] Health check passa
- [ ] Logs não mostram erros críticos

### **Após o Deploy:**
- [ ] URL responde corretamente
- [ ] `/health` retorna 200
- [ ] `/admin` carrega
- [ ] API endpoints funcionam
- [ ] Banco de dados está acessível

## 🚀 **Comandos Úteis**

```bash
# Diagnóstico completo
npm run render-diagnostic

# Teste de banco
npm run test-db

# Build local
npm run build

# Teste local
npm start

# Verificar logs
tail -f logs/app.log
```

## 📞 **Suporte**

### **Se o problema persistir:**

1. **Verifique os logs do Render** - A maioria dos problemas aparece aqui
2. **Execute o diagnóstico** - `npm run render-diagnostic`
3. **Teste localmente** - `npm run build && npm start`
4. **Verifique variáveis de ambiente** - No dashboard do Render
5. **Confirme configuração do serviço** - Build/Start commands

### **Logs importantes para verificar:**
- Build logs (erros de compilação)
- Runtime logs (erros de execução)
- Health check logs (problemas de inicialização)
- Database logs (problemas de conexão)

---

**💡 Dica:** Sempre teste localmente antes de fazer deploy no Render! 