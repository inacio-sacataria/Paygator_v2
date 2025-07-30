# 🐳 PostgreSQL no Render - Paygator

Guia para configurar PostgreSQL local no Render usando PostgreSQL Service.

## 🚀 **Opção 1: PostgreSQL Service do Render (RECOMENDADO)**

### **1. Criar PostgreSQL Service no Render**

1. **Acesse o Dashboard do Render**
2. **Clique em "New" → "PostgreSQL"**
3. **Configure:**
   - **Name:** `paygator-postgres`
   - **Database:** `paygator`
   - **User:** `paygator_user`
   - **Region:** `Oregon` (mesma do seu app)
   - **PostgreSQL Version:** `15`

### **2. Obter Credenciais**

Após criar, você receberá:
```
External Database URL: postgresql://paygator_user:password@host:port/paygator
Internal Database URL: postgresql://paygator_user:password@host:port/paygator
```

### **3. Configurar Variáveis de Ambiente**

No seu **Web Service**, adicione estas variáveis:

```bash
# PostgreSQL Render
SUPABASE_HOST=host-do-render-postgres
SUPABASE_PORT=5432
SUPABASE_DATABASE=paygator
SUPABASE_USER=paygator_user
SUPABASE_PASSWORD=sua-senha-aqui
```

### **4. Conectar os Serviços**

1. **No seu Web Service**
2. **Vá em "Environment"**
3. **Clique em "Link Resource"**
4. **Selecione seu PostgreSQL Service**

## 🔧 **Opção 2: Usar PostgreSQL Local no Container**

### **1. Modificar Dockerfile**

Crie um `Dockerfile.render`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar PostgreSQL client
RUN apk add --no-cache postgresql-client

# Copiar arquivos
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Instalar PostgreSQL no container
RUN apk add --no-cache postgresql

# Script de inicialização
COPY scripts/init-postgres.sh /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/init-postgres.sh

EXPOSE 3000

CMD ["./entrypoint.sh"]
```

### **2. Criar Script de Inicialização**

Crie `scripts/init-postgres.sh`:

```bash
#!/bin/bash
set -e

# Iniciar PostgreSQL
pg_ctl -D /var/lib/postgresql/data -l logfile start

# Criar banco e usuário
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE paygator;
    CREATE USER paygator_user WITH PASSWORD 'postgres123';
    GRANT ALL PRIVILEGES ON DATABASE paygator TO paygator_user;
EOSQL

# Executar script de inicialização
psql -v ON_ERROR_STOP=1 --username "paygator_user" --dbname "paygator" -f /app/scripts/init-db.sql
```

## 🎯 **Opção 3: Usar Supabase (MAIS SIMPLES)**

### **Manter Supabase e apenas melhorar a configuração:**

1. **Verificar variáveis no Render:**
```bash
SUPABASE_HOST=db.llrcdfutvjrrccgytbjh.supabase.co
SUPABASE_PORT=5432
SUPABASE_DATABASE=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=.7K8.PfQWJH@#-d
```

2. **Melhorar retry mechanism:**
```typescript
// Já implementado no src/config/supabase.ts
```

## 📊 **Comparação das Opções**

| Aspecto | PostgreSQL Service | Container Local | Supabase |
|---------|-------------------|-----------------|----------|
| **Configuração** | ✅ Fácil | ❌ Complexa | ✅ Fácil |
| **Performance** | ✅ Boa | ✅ Excelente | ✅ Boa |
| **Custo** | 💰 $7/mês | ✅ Gratuito | ✅ Gratuito |
| **Backup** | ✅ Automático | ❌ Manual | ✅ Automático |
| **Manutenção** | ✅ Automática | ❌ Manual | ✅ Automática |

## 🚀 **Recomendação: Usar PostgreSQL Service**

### **Vantagens:**
- ✅ Configuração simples
- ✅ Backup automático
- ✅ Integração nativa com Render
- ✅ Performance otimizada
- ✅ Monitoramento incluído

### **Passos:**

1. **Criar PostgreSQL Service no Render**
2. **Configurar variáveis de ambiente**
3. **Linkar os serviços**
4. **Deploy automático**

## 🔧 **Configuração Detalhada**

### **1. Criar PostgreSQL Service:**

```yaml
# render.yaml
services:
  - type: postgresql
    name: paygator-postgres
    plan: starter
    region: oregon
    databaseName: paygator
    user: paygator_user
```

### **2. Configurar Web Service:**

```yaml
services:
  - type: web
    name: paygator-webhook-api
    env: docker
    plan: starter
    region: oregon
    buildCommand: npm run build
    startCommand: ./entrypoint.sh
    envVars:
      - key: SUPABASE_HOST
        fromService:
          name: paygator-postgres
          type: postgresql
          property: host
      - key: SUPABASE_PORT
        fromService:
          name: paygator-postgres
          type: postgresql
          property: port
      - key: SUPABASE_DATABASE
        fromService:
          name: paygator-postgres
          type: postgresql
          property: database
      - key: SUPABASE_USER
        fromService:
          name: paygator-postgres
          type: postgresql
          property: user
      - key: SUPABASE_PASSWORD
        fromService:
          name: paygator-postgres
          type: postgresql
          property: password
```

## 🎯 **Próximos Passos**

### **Opção 1 (Recomendada):**
1. Criar PostgreSQL Service no Render
2. Configurar variáveis de ambiente
3. Linkar serviços
4. Deploy

### **Opção 2 (Manter Supabase):**
1. Verificar variáveis no Render
2. Melhorar retry mechanism
3. Deploy

### **Opção 3 (Container Local):**
1. Modificar Dockerfile
2. Criar scripts de inicialização
3. Deploy

---

**💡 Recomendação:** Use o **PostgreSQL Service do Render** - é a opção mais simples e confiável! 