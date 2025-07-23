#!/usr/bin/env node

const http = require('http');

async function simpleTest() {
  console.log('🔍 Teste simples do servidor...\n');
  
  // Test 1: Health check
  console.log('1. Testando health check...');
  const healthResult = await makeRequest('/health', 'GET');
  console.log('   Status:', healthResult.statusCode);
  console.log('   Success:', healthResult.success);
  console.log('   Message:', healthResult.message);
  
  // Test 2: Create payment
  console.log('\n2. Testando criação de pagamento...');
  const paymentData = { amount: 100.50 };
  const paymentResult = await makeRequest('/api/v1/payments/create', 'POST', paymentData);
  console.log('   Status:', paymentResult.statusCode);
  console.log('   Success:', paymentResult.success);
  console.log('   Message:', paymentResult.message);
  
  // Test 3: PlayFood status
  console.log('\n3. Testando status PlayFood...');
  const statusResult = await makeRequest('/api/v1/playfood/status', 'GET');
  console.log('   Status:', statusResult.statusCode);
  console.log('   Success:', statusResult.success);
  if (statusResult.success) {
    console.log('   Database Status:', statusResult.data.database?.status);
    console.log('   Database Message:', statusResult.data.database?.message);
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

simpleTest().catch(console.error); 