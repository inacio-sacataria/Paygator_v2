const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🐳 Configurando PostgreSQL Local com Docker');
console.log('===========================================');

// Configuração do ambiente local
const envLocalContent = `# Configuração PostgreSQL Local (Docker)
NODE_ENV=development
PORT=3000

# PostgreSQL Local (Docker)
SUPABASE_HOST=localhost
SUPABASE_PORT=5432
SUPABASE_DATABASE=paygator
SUPABASE_USER=postgres
SUPABASE_PASSWORD=postgres123

# Outras configurações
WEBHOOK_SECRET=1a02aa5907a7bc447b392f07548cf2a0f7713be742787327e4c4302c6960ee24
API_KEY=main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e
PLAYFOOD_API_KEY=playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5
JWT_SECRET=default-jwt-secret
SESSION_SECRET=paygator-secret
ADMIN_PASSWORD=admin123

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# CORS
ALLOWED_ORIGINS=http://localhost:3000
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=Content-Type,Authorization,X-API-Key,X-Webhook-Signature
`;

async function setupLocalDocker() {
  try {
    console.log('🔧 Verificando Docker...');
    
    // Verificar se Docker está instalado
    try {
      execSync('docker --version', { stdio: 'pipe' });
      console.log('✅ Docker encontrado');
    } catch (error) {
      console.error('❌ Docker não encontrado');
      console.log('💡 Instale o Docker: https://docs.docker.com/get-docker/');
      return;
    }

    // Verificar se Docker Compose está disponível
    try {
      execSync('docker-compose --version', { stdio: 'pipe' });
      console.log('✅ Docker Compose encontrado');
    } catch (error) {
      console.log('⚠️  Docker Compose não encontrado, tentando docker compose...');
      try {
        execSync('docker compose version', { stdio: 'pipe' });
        console.log('✅ Docker Compose (v2) encontrado');
      } catch (error2) {
        console.error('❌ Docker Compose não encontrado');
        console.log('💡 Instale o Docker Compose');
        return;
      }
    }

    console.log('\n🐳 Iniciando PostgreSQL com Docker...');
    
    // Parar containers existentes
    try {
      execSync('docker-compose down', { stdio: 'pipe' });
      console.log('✅ Containers anteriores parados');
    } catch (error) {
      // Ignorar erro se não houver containers
    }

    // Iniciar containers
    try {
      execSync('docker-compose up -d', { stdio: 'inherit' });
      console.log('✅ Containers iniciados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao iniciar containers:', error.message);
      return;
    }

    console.log('\n⏳ Aguardando PostgreSQL inicializar...');
    
    // Aguardar PostgreSQL estar pronto
    let retries = 30;
    while (retries > 0) {
      try {
        execSync('docker-compose exec -T postgres pg_isready -U postgres', { stdio: 'pipe' });
        console.log('✅ PostgreSQL está pronto!');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error('❌ PostgreSQL não inicializou em tempo hábil');
          return;
        }
        console.log(`⏳ Aguardando... (${retries} tentativas restantes)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n📊 Verificando dados...');
    
    // Verificar se as tabelas foram criadas
    try {
      const result = execSync('docker-compose exec -T postgres psql -U postgres -d paygator -c "SELECT COUNT(*) FROM payments;"', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log('✅ Tabelas criadas com sucesso!');
      console.log('📈 Resultado:', result.trim());
    } catch (error) {
      console.log('⚠️  Erro ao verificar tabelas:', error.message);
    }

    // Criar arquivo .env.local
    fs.writeFileSync('.env.local', envLocalContent);
    console.log('📝 Arquivo .env.local criado!');

    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('\n📋 Informações importantes:');
    console.log('================================');
    console.log('🌐 PostgreSQL: localhost:5432');
    console.log('📊 Database: paygator');
    console.log('👤 User: postgres');
    console.log('🔑 Password: postgres123');
    console.log('🖥️  pgAdmin: http://localhost:8080');
    console.log('   Email: admin@paygator.com');
    console.log('   Password: admin123');
    
    console.log('\n🚀 Para usar PostgreSQL local:');
    console.log('1. Copie .env.local para .env: cp .env.local .env');
    console.log('2. Teste a conexão: npm run test-db');
    console.log('3. Inicie o servidor: npm start');
    
    console.log('\n🛠️ Comandos úteis:');
    console.log('- Parar containers: docker-compose down');
    console.log('- Ver logs: docker-compose logs -f');
    console.log('- Acessar PostgreSQL: docker-compose exec postgres psql -U postgres -d paygator');
    console.log('- Backup: docker-compose exec postgres pg_dump -U postgres paygator > backup.sql');
    
    console.log('\n💡 Para voltar ao Supabase:');
    console.log('- Restaure o arquivo .env original');
    console.log('- Reinicie o servidor: npm start');

  } catch (error) {
    console.error('❌ Erro durante configuração:', error.message);
    console.log('\n💡 Verifique se:');
    console.log('1. Docker está instalado e rodando');
    console.log('2. Porta 5432 está disponível');
    console.log('3. Porta 8080 está disponível (para pgAdmin)');
  }
}

setupLocalDocker(); 