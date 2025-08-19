const fs = require('fs');
const path = require('path');

console.log('📁 Copiando arquivos de views para o build...\n');

// Diretórios de origem e destino
const srcViewsDir = path.join(process.cwd(), 'src', 'views');
const distViewsDir = path.join(process.cwd(), 'dist', 'src', 'views');
const publicDir = path.join(process.cwd(), 'public');
const distPublicDir = path.join(process.cwd(), 'dist', 'public');

// EM PRODUÇÃO: O Express está procurando em /app/src/views
// Vamos copiar para lá também!
const productionViewsDir = path.join(process.cwd(), 'src', 'views');

// Função para copiar diretório recursivamente
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`   ✅ Copiado: ${srcPath} → ${destPath}`);
    }
  }
}

// Função para verificar se diretório existe
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   📁 Criado diretório: ${dir}`);
  }
}

try {
  // 1. Copiar views para dist (para desenvolvimento)
  if (fs.existsSync(srcViewsDir)) {
    console.log('📋 Copiando views para dist...');
    ensureDirectoryExists(distViewsDir);
    copyDirectory(srcViewsDir, distViewsDir);
    console.log(`   ✅ Views copiadas para: ${distViewsDir}\n`);
  } else {
    console.log(`   ❌ Diretório de views não encontrado: ${srcViewsDir}\n`);
  }

  // 2. EM PRODUÇÃO: Garantir que src/views existe (onde o Express procura)
  console.log('🏭 Garantindo que src/views existe para produção...');
  if (!fs.existsSync(productionViewsDir)) {
    fs.mkdirSync(productionViewsDir, { recursive: true });
    console.log(`   📁 Criado diretório: ${productionViewsDir}`);
  }
  
  // Copiar views para src/views também (para produção)
  if (fs.existsSync(srcViewsDir)) {
    copyDirectory(srcViewsDir, productionViewsDir);
    console.log(`   ✅ Views copiadas para: ${productionViewsDir}\n`);
  }

  // 3. Copiar arquivos públicos
  if (fs.existsSync(publicDir)) {
    console.log('📁 Copiando arquivos públicos...');
    ensureDirectoryExists(distPublicDir);
    copyDirectory(publicDir, distPublicDir);
    console.log(`   ✅ Arquivos públicos copiados para: ${distPublicDir}\n`);
  } else {
    console.log(`   ❌ Diretório público não encontrado: ${publicDir}\n`);
  }

  // 4. Verificar estrutura final
  console.log('🔍 Verificando estrutura do build...');
  
  if (fs.existsSync(distViewsDir)) {
    const viewFiles = fs.readdirSync(distViewsDir);
    console.log(`   📋 Views no build: ${viewFiles.length} arquivos`);
    viewFiles.forEach(file => console.log(`      - ${file}`));
  }
  
  if (fs.existsSync(distPublicDir)) {
    const publicFiles = fs.readdirSync(distPublicDir);
    console.log(`   📁 Arquivos públicos no build: ${publicFiles.length} arquivos`);
    publicFiles.forEach(file => console.log(`      - ${file}`));
  }

  console.log('\n🎉 Build preparado com sucesso!');
  console.log('\n📝 Para produção, certifique-se de:');
  console.log('   1. Executar "npm run build"');
  console.log('   2. Executar "node scripts/copy-views.js"');
  console.log('   3. Fazer deploy com todos os arquivos');

} catch (error) {
  console.error('❌ Erro durante cópia:', error.message);
  process.exit(1);
}
