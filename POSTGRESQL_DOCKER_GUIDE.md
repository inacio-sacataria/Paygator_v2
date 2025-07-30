# 🐳 PostgreSQL Local com Docker - Paygator

Guia rápido para configurar e usar PostgreSQL local com Docker.

## 🚀 **Configuração Rápida**

### **1. Pré-requisitos**
- ✅ Docker instalado
- ✅ Docker Compose instalado
- ✅ Node.js 18+

### **2. Configuração Automática**
```bash
# Executar configuração automática
npm run setup-docker
```

### **3. Configuração Manual**
```bash
# 1. Iniciar containers
docker-compose up -d

# 2. Aguardar PostgreSQL inicializar
# (aguarde alguns segundos)

# 3. Copiar configuração local
cp .env.local .env

# 4. Testar conexão
npm run test-db

# 5. Iniciar servidor
npm start
```

## 📊 **Informações do Banco**

### **Conexão:**
- **Host:** localhost
- **Porta:** 5432
- **Database:** paygator
- **User:** postgres
- **Password:** postgres123

### **Interface Web (pgAdmin):**
- **URL:** http://localhost:8080
- **Email:** admin@paygator.com
- **Password:** admin123

## 🛠️ **Comandos Úteis**

### **Gerenciar Containers:**
```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart
```

### **Acessar PostgreSQL:**
```bash
# Via linha de comando
docker-compose exec postgres psql -U postgres -d paygator

# Backup
docker-compose exec postgres pg_dump -U postgres paygator > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres -d paygator < backup.sql
```

### **Verificar Status:**
```bash
# Verificar se está rodando
docker-compose ps

# Ver logs do PostgreSQL
docker-compose logs postgres

# Ver logs do pgAdmin
docker-compose logs pgadmin
```

## 📋 **Tabelas Criadas**

### **payments**
- Armazena informações de pagamentos
- Dados de exemplo incluídos

### **api_logs**
- Logs de todas as requisições da API
- Dados de exemplo incluídos

### **payment_logs**
- Logs de mudanças de status de pagamentos
- Dados de exemplo incluídos

### **auth_logs**
- Logs de autenticação
- Vazia por padrão

## 🔄 **Alternar entre Supabase e Local**

### **Para usar PostgreSQL Local:**
```bash
cp .env.local .env
npm start
```

### **Para voltar ao Supabase:**
```bash
# Restaure o arquivo .env original
git checkout .env
npm start
```

## 🚨 **Troubleshooting**

### **Problema: Porta 5432 já em uso**
```bash
# Verificar o que está usando a porta
netstat -an | grep 5432

# Parar PostgreSQL local se estiver rodando
sudo service postgresql stop
```

### **Problema: Docker não inicia**
```bash
# Verificar se Docker está rodando
docker --version
docker-compose --version

# Reiniciar Docker Desktop
```

### **Problema: Containers não iniciam**
```bash
# Verificar logs
docker-compose logs

# Limpar e recriar
docker-compose down -v
docker-compose up -d
```

### **Problema: Aplicação não conecta**
```bash
# Verificar se PostgreSQL está pronto
docker-compose exec postgres pg_isready -U postgres

# Testar conexão
npm run test-db
```

## 📈 **Vantagens do PostgreSQL Local**

### **✅ Vantagens:**
- ✅ Controle total
- ✅ Sem dependência de internet
- ✅ Performance superior
- ✅ Sem limitações de conexões
- ✅ Backup fácil
- ✅ Desenvolvimento offline

### **❌ Desvantagens:**
- ❌ Configuração inicial
- ❌ Necessita Docker
- ❌ Backup manual
- ❌ Manutenção local

## 🎯 **Quando Usar**

### **Use PostgreSQL Local para:**
- ✅ Desenvolvimento local
- ✅ Testes intensivos
- ✅ Quando Supabase estiver instável
- ✅ Desenvolvimento offline
- ✅ Controle total dos dados

### **Use Supabase para:**
- ✅ Produção
- ✅ Deploy em nuvem
- ✅ Backup automático
- ✅ Interface web
- ✅ Equipe distribuída

## 🚀 **Próximos Passos**

1. **Execute a configuração:**
   ```bash
   npm run setup-docker
   ```

2. **Teste a conexão:**
   ```bash
   npm run test-db
   ```

3. **Inicie o servidor:**
   ```bash
   npm start
   ```

4. **Acesse a aplicação:**
   - **App:** http://localhost:3000
   - **Admin:** http://localhost:3000/admin
   - **pgAdmin:** http://localhost:8080

---

**💡 Dica:** O PostgreSQL local é perfeito para desenvolvimento e testes. Para produção, continue usando Supabase! 