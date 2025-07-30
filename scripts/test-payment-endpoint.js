#!/usr/bin/env node

const http = require('http');

const testPayment = () => {
  const postData = JSON.stringify({
    amount: 100,
    currency: "BRL",
    customer: {
      email: "test@example.com",
      name: "Test User"
    }
  });

  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/payments/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'X-API-Key': 'default-api-key-secret'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response Body:');
      console.log(data);
      
      try {
        const parsed = JSON.parse(data);
        console.log('\nParsed Response:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Could not parse JSON response');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(postData);
  req.end();
};

console.log('Testing payment endpoint...');
testPayment(); 