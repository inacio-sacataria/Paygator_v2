# 🐳 Instalar Docker Desktop - Windows

Guia completo para instalar Docker Desktop no Windows.

## 🚀 **Passo 1: Baixar Docker Desktop**

### **1. Acessar o site oficial:**
- Vá para: https://www.docker.com/products/docker-desktop/
- Clique em **"Download for Windows"**

### **2. Verificar requisitos:**
- ✅ Windows 10/11 (64-bit)
- ✅ WSL 2 (será instalado automaticamente)
- ✅ 4GB RAM mínimo
- ✅ 20GB espaço livre

## 🔧 **Passo 2: Instalar**

### **1. Executar o instalador:**
- Baixe o arquivo `.exe`
- Execute como **administrador**
- Siga as instruções na tela

### **2. Durante a instalação:**
- ✅ Marque "Use WSL 2 instead of Hyper-V"
- ✅ Marque "Add shortcut to desktop"
- ✅ Marque "Use the WSL 2 based engine"

### **3. Reiniciar o computador:**
- Após a instalação, **reinicie o Windows**
- Isso é importante para o WSL 2 funcionar

## 🚀 **Passo 3: Configurar**

### **1. Primeira execução:**
- Procure "Docker Desktop" no menu iniciar
- Execute como **administrador**
- Aguarde a inicialização (pode demorar 5-10 minutos)

### **2. Aceitar termos:**
- Clique em "Accept" nos termos de uso
- Aguarde o download das imagens

### **3. Verificar instalação:**
```bash
# Abrir PowerShell e executar:
docker --version
docker-compose --version
```

## 🚨 **Problemas Comuns**

### **Problema: "WSL 2 not found"**
**Solução:**
```bash
# No PowerShell como administrador:
wsl --install
# Reiniciar computador
wsl --set-default-version 2
```

### **Problema: "Hyper-V not available"**
**Solução:**
- Vá em "Recursos do Windows"
- Ative "Plataforma de máquina virtual"
- Reinicie o computador

### **Problema: "Docker Desktop won't start"**
**Solução:**
1. Desinstale Docker Desktop
2. Reinicie o computador
3. Instale novamente
4. Execute como administrador

## ✅ **Após Docker Instalado**

### **1. Verificar se está funcionando:**
```bash
docker ps
```

### **2. Configurar PostgreSQL:**
```bash
npm run setup-docker
```

### **3. Testar e usar:**
```bash
# Testar conexão
npm run test-db

# Usar PostgreSQL local
cp .env.local .env
npm start
```

## 📊 **Informações do PostgreSQL Local**

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

## 🎯 **Comandos Úteis**

### **Verificar Docker:**
```bash
docker --version
docker ps
docker-compose --version
```

### **Configurar PostgreSQL:**
```bash
npm run setup-docker
```

### **Testar Banco:**
```bash
npm run test-db
```

### **Usar Local:**
```bash
cp .env.local .env
npm start
```

### **Voltar ao Supabase:**
```bash
git checkout .env
npm start
```

## 🚀 **Próximos Passos**

1. **Instalar Docker Desktop**
2. **Reiniciar computador**
3. **Iniciar Docker Desktop**
4. **Executar configuração:**
   ```bash
   npm run setup-docker
   ```
5. **Testar conexão:**
   ```bash
   npm run test-db
   ```
6. **Usar PostgreSQL local:**
   ```bash
   cp .env.local .env
   npm start
   ```

---

**💡 Dica:** A instalação pode demorar 10-15 minutos. Seja paciente! 