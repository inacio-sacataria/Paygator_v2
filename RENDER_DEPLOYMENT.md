# 🚀 Deploy no Render - Paygator API

Este guia explica como fazer o deploy da Paygator API no Render.

---

## ⚡ Deploy rápido (API + PostgreSQL grupogo)

Já tens a base **grupogo** no Render. Segue estes passos para colocar a API no ar.

### 1. Criar Web Service no Render

1. Abre [dashboard.render.com](https://dashboard.render.com)
2. **New +** → **Web Service**
3. Liga o repositório GitHub e escolhe **Paygator_v2** (ou o repo onde está o projeto)
4. Configura:
   - **Name:** `paygator-api` (ou outro nome; a URL será `https://<name>.onrender.com`)
   - **Region:** Oregon (ou o que preferires)
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (ou pago se quiseres)

### 2. Variáveis de ambiente obrigatórias

Em **Environment** do serviço, adiciona (usa **Secret** para API_KEY, WEBHOOK_SECRET e DATABASE_URL):

| Key | Value | Notas |
|-----|--------|--------|
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Render define automaticamente; 10000 é o padrão |
| `DATABASE_URL` | *(External Database URL do grupogo)* | No Render: PostgreSQL → grupogo → **External Database URL** |
| `API_KEY` | *(a tua chave)* | Ex.: a que tens no `.env` local |
| `WEBHOOK_SECRET` | *(o teu secret)* | Ex.: o que tens no `.env` local |
| `BASE_URL` | `https://paygator-api.onrender.com` | Substitui pelo nome real do teu serviço |

**DATABASE_URL** (copiar do Render, base grupogo):
```
postgresql://grupogo_user:PASSWORD@dpg-d652m4dum26s73birp60-a.oregon-postgres.render.com/grupogo
```

### 3. Deploy

- Clica **Create Web Service**. O Render faz o build e o deploy.
- No primeiro deploy o Free tier pode demorar 1–2 min a arrancar.
- Testa: `https://<teu-serviço>.onrender.com/health`

### 4. (Opcional) Dashboard no mesmo projeto

Para publicar o dashboard no Render como Static Site:

1. **New +** → **Static Site**
2. Mesmo repositório, **Root Directory** vazio (raiz)
3. **Build Command:** `cd dashboard && npm install && npm run build`
4. **Publish Directory:** `dashboard/dist`
5. **Environment:** `VITE_API_URL` = `https://paygator-api.onrender.com` (URL da API)
6. Em **ALLOWED_ORIGINS** da API, adiciona a URL do dashboard (ex.: `https://paygator-dashboard.onrender.com`)

---

## 🔧 Configuração detalhada (referência)

### Variáveis de ambiente (lista completa)

#### Configurações Básicas
```
NODE_ENV=production
PORT=10000
API_VERSION=v1
```

#### Segurança (definir no Render como Secret)
```
WEBHOOK_SECRET=<o teu webhook secret>
API_KEY=<a tua API key>
PLAYFOOD_API_KEY=<opcional>
JWT_SECRET=<gerar um aleatório>
SESSION_SECRET=<gerar um aleatório>
ADMIN_PASSWORD=<password do admin>
```

#### Base de dados (PostgreSQL Render - grupogo)
```
DATABASE_URL=postgresql://grupogo_user:xxx@dpg-d652m4dum26s73birp60-a.oregon-postgres.render.com/grupogo
```
*(Usar a External Database URL do painel do Render.)*

#### Logging e Monitoramento
```
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log
ENABLE_METRICS=false
```

#### CORS Configuration
```
ALLOWED_ORIGINS=https://your-frontend-domain.com
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=Content-Type,Authorization,X-API-Key,X-Webhook-Signature
```

## 🔍 Solução de Problemas

### Erro de Conexão com Banco de Dados

Se você encontrar erros como `ENETUNREACH` ou problemas de conectividade:

1. **Verifique as variáveis de ambiente:**
   - Certifique-se de que todas as variáveis do Supabase estão configuradas
   - Verifique se a senha está correta

2. **Teste a conexão localmente:**
   ```bash
   npm run test-db
   ```

3. **Verifique o firewall do Supabase:**
   - Acesse o dashboard do Supabase
   - Vá em Settings → Database
   - Verifique se o IP do Render está na lista de IPs permitidos

4. **Use connection pooling (recomendado):**
   - Configure o Supabase para usar connection pooling
   - Atualize a URL de conexão para usar o pool

### Erro de Build

Se o build falhar:

1. **Verifique o Node.js version:**
   - Certifique-se de que está usando Node.js 18+
   - Adicione `"node": ">=18.0.0"` no package.json

2. **Verifique as dependências:**
   ```bash
   npm install
   npm run build
   ```

### Erro de Runtime

Se o aplicativo falhar ao iniciar:

1. **Verifique os logs:**
   - Acesse os logs no dashboard do Render
   - Procure por erros específicos

2. **Teste localmente:**
   ```bash
   npm run build
   npm start
   ```

## 📊 Monitoramento

### Health Check

O aplicativo expõe um endpoint de health check:

```
GET https://your-app.onrender.com/health
```

### Logs

Os logs são salvos em:
- Console (stdout/stderr)
- Arquivo: `logs/app.log`

### Métricas

Para habilitar métricas:
```
ENABLE_METRICS=true
METRICS_PORT=9090
```

## 🔐 Segurança

### Recomendações

1. **Rotacione as chaves regularmente**
2. **Use HTTPS sempre**
3. **Configure rate limiting**
4. **Monitore os logs**
5. **Faça backup regular dos dados**

### Variáveis Sensíveis

Nunca commite as seguintes variáveis no código:
- `SUPABASE_PASSWORD`
- `WEBHOOK_SECRET`
- `API_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`

## 🚀 Deploy Automático

O Render oferece deploy automático:

1. **Push para main:** Deploy automático
2. **Pull Requests:** Preview deployments
3. **Rollback:** Disponível no dashboard

## 📞 Suporte

Se você encontrar problemas:

1. Verifique os logs no Render
2. Teste localmente com `npm run test-db`
3. Verifique a documentação do Supabase
4. Abra uma issue no GitHub

## 🔗 Links Úteis

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/) 