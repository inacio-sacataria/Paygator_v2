#!/usr/bin/env node

const axios = require('axios');

async function main() {
  const url = 'http://localhost:3000/api/v1/payments/info';
  const payload = {
    paymentId: process.env.PAYMENT_ID || 'pay_test',
    externalPayment: {
      id: process.env.EXTERNAL_PAYMENT_ID || 'ext_abc',
      data: {}
    }
  };

  try {
    const res = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

main();


