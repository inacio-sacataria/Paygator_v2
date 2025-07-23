#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key-123';

async function testLogEndpoints() {
  console.log('🧪 Testando endpoints de logs...\n');

  const endpoints = [
    {
      name: 'API Logs',
      url: `${BASE_URL}/admin/api/logs`,
      method: 'GET'
    },
    {
      name: 'Payment Logs',
      url: `${BASE_URL}/admin/api/payment-logs`,
      method: 'GET'
    },
    {
      name: 'Log Stats',
      url: `${BASE_URL}/admin/api/log-stats`,
      method: 'GET'
    },
    {
      name: 'API Logs with limit',
      url: `${BASE_URL}/admin/api/logs?limit=5`,
      method: 'GET'
    },
    {
      name: 'Payment Logs with limit',
      url: `${BASE_URL}/admin/api/payment-logs?limit=5`,
      method: 'GET'
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testando: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Response:`, JSON.stringify(data, null, 2));
      console.log('');
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      console.log('');
    }
  }

  // Testar também sem API key
  console.log('🔓 Testando sem API key...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/admin/api/logs`);
    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
}

testLogEndpoints().catch(console.error);