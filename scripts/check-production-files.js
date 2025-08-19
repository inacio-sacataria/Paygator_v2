const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando arquivos necessários para produção...\n');

// Arquivos e diretórios essenciais
const essentialFiles = [
  'src/views/payment-form.ejs',
  'public/js/payment-form.js',
  'src/routes/paymentFormRoutes.ts',
  'src/config/sqlite.ts',
  'src/services/sqliteService.ts',
  'src/controllers/paymentController.ts',
  'src/config/environment.ts'
];

// Verificar arquivos essenciais
console.log('📋 Verificando arquivos essenciais:');
let allFilesExist = true;

essentialFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Verificar se o build foi feito
console.log('\n🔨 Verificando build:');
const distDir = path.join(process.cwd(), 'dist');
const distExists = fs.existsSync(distDir);
console.log(`   ${distExists ? '✅' : '❌'} Diretório dist/ existe`);

if (distExists) {
  const distFiles = fs.readdirSync(distDir);
  console.log(`   📁 Arquivos no dist/: ${distFiles.length}`);
  distFiles.forEach(file => {
    console.log(`      - ${file}`);
  });
}

// Verificar package.json
console.log('\n📦 Verificando package.json:');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`   ✅ Nome: ${packageJson.name}`);
  console.log(`   ✅ Versão: ${packageJson.version}`);
  console.log(`   ✅ Scripts: ${Object.keys(packageJson.scripts).join(', ')}`);
  
  // Verificar se o script start existe
  if (packageJson.scripts.start) {
    console.log(`   ✅ Script start: ${packageJson.scripts.start}`);
  } else {
    console.log(`   ❌ Script start não encontrado!`);
    allFilesExist = false;
  }
} else {
  console.log(`   ❌ package.json não encontrado!`);
  allFilesExist = false;
}

// Verificar se o EJS está instalado
console.log('\n📚 Verificando dependências:');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  const ejsPath = path.join(nodeModulesPath, 'ejs');
  const ejsExists = fs.existsSync(ejsPath);
  console.log(`   ${ejsExists ? '✅' : '❌'} EJS instalado`);
  
  const sqlitePath = path.join(nodeModulesPath, 'sqlite3');
  const sqliteExists = fs.existsSync(sqlitePath);
  console.log(`   ${sqliteExists ? '✅' : '❌'} SQLite3 instalado`);
  
  const sqlitePath2 = path.join(nodeModulesPath, 'sqlite');
  const sqlite2Exists = fs.existsSync(sqlitePath2);
  console.log(`   ${sqlite2Exists ? '✅' : '❌'} SQLite instalado`);
} else {
  console.log(`   ❌ node_modules não encontrado!`);
  allFilesExist = false;
}

// Resumo
console.log('\n📊 Resumo:');
if (allFilesExist && distExists) {
  console.log('   🎉 Todos os arquivos essenciais estão presentes!');
  console.log('   🚀 Aplicação pronta para produção.');
} else {
  console.log('   ⚠️  Alguns arquivos estão ausentes ou há problemas.');
  console.log('   🔧 Execute "npm run build" antes do deploy.');
}

console.log('\n🎯 Para produção, certifique-se de:');
console.log('   1. Executar "npm run build"');
console.log('   2. Configurar variáveis de ambiente (BASE_URL, NODE_ENV)');
console.log('   3. Verificar se o SQLite tem permissões de escrita');
console.log('   4. Testar localmente com NODE_ENV=production');
