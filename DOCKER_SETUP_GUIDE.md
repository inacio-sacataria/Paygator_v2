# 🐳 Configuração do Docker - Windows

Guia para configurar Docker Desktop no Windows para usar PostgreSQL local.

## 🚀 **Instalação do Docker Desktop**

### **1. Baixar Docker Desktop**
- Acesse: https://www.docker.com/products/docker-desktop/
- Baixe a versão para Windows
- Execute o instalador

### **2. Configuração Inicial**
1. **Instalar WSL 2 (se necessário)**
   - Docker Desktop pode solicitar para instalar WSL 2
   - Siga as instruções na tela

2. **Reiniciar o computador**
   - Após a instalação, reinicie o Windows

3. **Iniciar Docker Desktop**
   - Procure por "Docker Desktop" no menu iniciar
   - Execute como administrador na primeira vez

## 🔧 **Verificar Instalação**

### **1. Verificar se Docker está rodando**
```bash
# Abrir PowerShell como administrador
docker --version
docker-compose --version
```

### **2. Testar Docker**
```bash
# Testar se Docker está funcionando
docker run hello-world
```

## 🚨 **Problemas Comuns**

### **Problema: "Docker daemon is not running"**
**Solução:**
1. Abra Docker Desktop
2. Aguarde o ícone ficar verde
3. Verifique se não há atualizações pendentes

### **Problema: "Permission denied"**
**Solução:**
1. Execute PowerShell como administrador
2. Ou adicione seu usuário ao grupo docker-users

### **Problema: "WSL 2 not found"**
**Solução:**
```bash
# Instalar WSL 2
wsl --install

# Reiniciar computador
# Executar novamente
wsl --set-default-version 2
```

## 🚀 **Após Docker Funcionando**

### **1. Configurar PostgreSQL Local**
```bash
# Executar configuração automática
npm run setup-docker
```

### **2. Verificar Containers**
```bash
# Ver se containers estão rodando
docker-compose ps

# Ver logs
docker-compose logs
```

### **3. Testar Conexão**
```bash
# Testar banco de dados
npm run test-db

# Iniciar aplicação
npm start
```

## 📊 **Informações dos Containers**

### **PostgreSQL:**
- **Porta:** 5432
- **Database:** paygator
- **User:** postgres
- **Password:** postgres123

### **pgAdmin (Interface Web):**
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

### **Verificar Status:**
```bash
# Ver containers rodando
docker ps

# Ver todos os containers
docker ps -a

# Ver imagens
docker images
```

### **Limpar Docker:**
```bash
# Parar todos os containers
docker stop $(docker ps -aq)

# Remover containers parados
docker container prune

# Remover imagens não usadas
docker image prune
```

## 🎯 **Próximos Passos**

1. **Instalar Docker Desktop**
2. **Iniciar Docker Desktop**
3. **Executar configuração:**
   ```bash
   npm run setup-docker
   ```
4. **Testar conexão:**
   ```bash
   npm run test-db
   ```
5. **Iniciar aplicação:**
   ```bash
   npm start
   ```

---

**💡 Dica:** Docker Desktop pode demorar alguns minutos para inicializar na primeira vez! 