# 🚀 Iniciar Docker Desktop - Guia Rápido

## 🔧 **Passo a Passo:**

### **1. Iniciar Docker Desktop**
- Abra o **Menu Iniciar** do Windows
- Procure por **"Docker Desktop"**
- Clique para abrir
- Aguarde o ícone ficar **verde** (pode demorar 1-2 minutos)

### **2. Verificar se está funcionando**
```bash
# No PowerShell, execute:
docker ps
```

Se retornar uma lista (mesmo vazia), está funcionando!

### **3. Configurar PostgreSQL**
```bash
# Depois que Docker estiver rodando:
npm run setup-docker
```

### **4. Testar e usar**
```bash
# Testar conexão
npm run test-db

# Usar PostgreSQL local
cp .env.local .env
npm start
```

## 🚨 **Se Docker não iniciar:**

### **Opção 1: Executar como Administrador**
- Clique com botão direito em "Docker Desktop"
- Selecione "Executar como administrador"

### **Opção 2: Reiniciar Docker**
- Clique com botão direito no ícone do Docker
- Selecione "Restart"

### **Opção 3: Verificar WSL 2**
```bash
# No PowerShell como administrador:
wsl --update
wsl --shutdown
```

## 📊 **Informações do PostgreSQL Local:**

- **Host:** localhost:5432
- **Database:** paygator
- **User:** postgres
- **Password:** postgres123
- **pgAdmin:** http://localhost:8080

## 🎯 **Comandos Úteis:**

```bash
# Verificar Docker
docker --version
docker ps

# Configurar PostgreSQL
npm run setup-docker

# Testar banco
npm run test-db

# Usar local
cp .env.local .env
npm start

# Voltar ao Supabase
git checkout .env
npm start
```

---

**💡 Dica:** Aguarde o ícone do Docker ficar verde antes de executar os comandos! 