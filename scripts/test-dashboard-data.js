#!/usr/bin/env node

const http = require('http');

// Test the dashboard data retrieval
async function testDashboardData() {
  console.log('🔍 Testando dados do dashboard...\n');
  
  // First, let's test the API endpoints to see if they're saving data
  const testPayment = {
    amount: 150.75,
    currency: 'BRL',
    payment_method: 'credit_card',
    customer: {
      email: 'test@dashboard.com',
      name: 'Test Dashboard User',
      phone: '+5511999999999'
    }
  };

  console.log('📝 Criando pagamento de teste...');
  
  // Create a test payment
  const createResult = await makeRequest('/api/v1/payments/create', 'POST', testPayment);
  
  if (createResult.success) {
    console.log('✅ Pagamento criado com sucesso!');
    console.log(`   Payment ID: ${createResult.data.externalPayment.id}`);
  } else {
    console.log('❌ Erro ao criar pagamento:', createResult.message);
  }

  console.log('\n📊 Testando estatísticas do dashboard...');
  
  // Test dashboard stats
  const statsResult = await makeRequest('/admin/api/stats', 'GET');
  
  if (statsResult.success) {
    console.log('✅ Estatísticas obtidas:');
    console.log(`   Total Payments: ${statsResult.data.totalPayments}`);
    console.log(`   Total Amount: R$ ${statsResult.data.totalAmount}`);
    console.log(`   Successful: ${statsResult.data.successfulPayments}`);
    console.log(`   Pending: ${statsResult.data.pendingPayments}`);
    console.log(`   Failed: ${statsResult.data.failedPayments}`);
    console.log(`   Today: ${statsResult.data.todayPayments}`);
  } else {
    console.log('❌ Erro ao obter estatísticas:', statsResult.message);
  }

  console.log('\n📋 Testando lista de pagamentos...');
  
  // Test payments list
  const paymentsResult = await makeRequest('/admin/api/payments', 'GET');
  
  if (paymentsResult.success) {
    console.log('✅ Lista de pagamentos obtida:');
    console.log(`   Total: ${paymentsResult.data.total}`);
    console.log(`   Page: ${paymentsResult.data.page}`);
    console.log(`   Payments: ${paymentsResult.data.payments.length}`);
    
    if (paymentsResult.data.payments.length > 0) {
      const payment = paymentsResult.data.payments[0];
      console.log('\n   Primeiro pagamento:');
      console.log(`     Payment ID: ${payment.payment_id}`);
      console.log(`     Amount: R$ ${payment.amount}`);
      console.log(`     Status: ${payment.status}`);
      console.log(`     Customer: ${payment.customer_email}`);
    }
  } else {
    console.log('❌ Erro ao obter pagamentos:', paymentsResult.message);
  }

  console.log('\n🔍 Verificando dados no Supabase diretamente...');
  
  // Test direct Supabase connection
  const supabaseResult = await makeRequest('/api/v1/playfood/status', 'GET');
  
  if (supabaseResult.success) {
    console.log('✅ Status do Supabase:');
    console.log(`   Database Status: ${supabaseResult.data.database.status}`);
    console.log(`   Message: ${supabaseResult.data.database.message}`);
  } else {
    console.log('❌ Erro ao verificar Supabase:', supabaseResult.message);
  }
}

async function makeRequest(path, method, body = null) {
  return new Promise((resolve) => {
    const options = {
      host: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'X-API-Key': 'main_70a3ae2d414936451d05d19f7ca4b01c1761ee04b519b93961f56fa2a27cc914',
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            success: res.statusCode < 400,
            statusCode: res.statusCode,
            data: response.data || response,
            message: response.message
          });
        } catch (error) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            data: null,
            message: 'Invalid JSON response',
            raw: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

testDashboardData().catch(console.error); 