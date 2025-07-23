#!/usr/bin/env node

const http = require('http');

async function testDashboardAPI() {
  console.log('🔍 Testando endpoints do dashboard...\n');
  
  // Test 1: Dashboard stats API
  console.log('1. Testando API de estatísticas do dashboard...');
  const statsResult = await makeRequest('/admin/api/stats', 'GET');
  console.log('   Status:', statsResult.statusCode);
  console.log('   Success:', statsResult.success);
  if (statsResult.success) {
    console.log('   Total Payments:', statsResult.data.totalPayments);
    console.log('   Total Amount:', statsResult.data.totalAmount);
    console.log('   Successful:', statsResult.data.successfulPayments);
    console.log('   Pending:', statsResult.data.pendingPayments);
    console.log('   Failed:', statsResult.data.failedPayments);
    console.log('   Today:', statsResult.data.todayPayments);
  } else {
    console.log('   Error:', statsResult.message);
  }
  
  // Test 2: Payments list API
  console.log('\n2. Testando API de lista de pagamentos...');
  const paymentsResult = await makeRequest('/admin/api/payments', 'GET');
  console.log('   Status:', paymentsResult.statusCode);
  console.log('   Success:', paymentsResult.success);
  if (paymentsResult.success) {
    console.log('   Total:', paymentsResult.data.total);
    console.log('   Page:', paymentsResult.data.page);
    console.log('   Payments Count:', paymentsResult.data.payments.length);
    
    if (paymentsResult.data.payments.length > 0) {
      const payment = paymentsResult.data.payments[0];
      console.log('\n   Primeiro pagamento:');
      console.log('     Payment ID:', payment.payment_id);
      console.log('     Amount:', payment.amount);
      console.log('     Status:', payment.status);
      console.log('     Customer:', payment.customer_email);
      console.log('     Created:', payment.created_at);
    }
  } else {
    console.log('   Error:', paymentsResult.message);
  }
  
  // Test 3: Create another payment to see if it appears
  console.log('\n3. Criando pagamento adicional para teste...');
  const paymentData = { 
    amount: 250.00,
    currency: 'BRL',
    payment_method: 'pix',
    customer: {
      email: 'dashboard@test.com',
      name: 'Dashboard Test User',
      phone: '+5511888888888'
    }
  };
  const createResult = await makeRequest('/api/v1/payments/create', 'POST', paymentData);
  console.log('   Status:', createResult.statusCode);
  console.log('   Success:', createResult.success);
  console.log('   Message:', createResult.message);
  
  // Test 4: Check stats again
  console.log('\n4. Verificando estatísticas novamente...');
  const statsResult2 = await makeRequest('/admin/api/stats', 'GET');
  if (statsResult2.success) {
    console.log('   Total Payments:', statsResult2.data.totalPayments);
    console.log('   Total Amount:', statsResult2.data.totalAmount);
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
            message: response.message || 'No message'
          });
        } catch (error) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            data: null,
            message: 'Invalid JSON response',
            raw: data.substring(0, 100)
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        message: `Connection error: ${error.message}`
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

testDashboardAPI().catch(console.error); 