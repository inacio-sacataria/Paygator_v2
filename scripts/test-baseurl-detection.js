// Script para testar a detecção automática do BASE_URL
import { config } from '../src/config/environment.js';

console.log('🧪 Testando detecção automática do BASE_URL...\n');

console.log('📋 Variáveis de ambiente:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`   BASE_URL: ${process.env.BASE_URL || 'undefined'}`);
console.log(`   RENDER_EXTERNAL_HOSTNAME: ${process.env.RENDER_EXTERNAL_HOSTNAME || 'undefined'}`);
console.log(`   HEROKU_APP_NAME: ${process.env.HEROKU_APP_NAME || 'undefined'}`);
console.log(`   RAILWAY_STATIC_URL: ${process.env.RAILWAY_STATIC_URL || 'undefined'}`);
console.log(`   VERCEL_URL: ${process.env.VERCEL_URL || 'undefined'}`);
console.log(`   PORT: ${process.env.PORT || 'undefined'}`);

console.log('\n🎯 BASE_URL detectado:');
console.log(`   ${config.server.baseUrl}`);

console.log('\n🔍 Lógica de detecção:');
if (process.env.BASE_URL) {
  console.log('   ✅ BASE_URL definido explicitamente');
} else if (process.env.NODE_ENV === 'production') {
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    console.log('   ✅ Detectado: Render');
  } else if (process.env.HEROKU_APP_NAME) {
    console.log('   ✅ Detectado: Heroku');
  } else if (process.env.RAILWAY_STATIC_URL) {
    console.log('   ✅ Detectado: Railway');
  } else if (process.env.VERCEL_URL) {
    console.log('   ✅ Detectado: Vercel');
  } else {
    console.log('   ⚠️  Produção detectada, mas plataforma não identificada');
  }
} else {
  console.log('   ✅ Desenvolvimento local');
}

console.log('\n📝 Para produção, configure uma das opções:');
console.log('   1. BASE_URL=https://seu-app.onrender.com');
console.log('   2. NODE_ENV=production (detecção automática)');
console.log('   3. RENDER_EXTERNAL_HOSTNAME=seu-app.onrender.com');
