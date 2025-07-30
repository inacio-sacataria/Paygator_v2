#!/usr/bin/env node

const http = require('http');

const testPaymentWithItems = () => {
  const postData = JSON.stringify({
    amount: 150.50,
    currency: "BRL",
    customer: {
      email: "customer@example.com",
      name: "Test Customer",
      phone: "+5511999999999"
    },
    orderDetails: {
      orderId: "order_12345",
      items: [
        {
          id: "item_1",
          name: "Pizza Margherita",
          quantity: 2,
          unit_price: 45.00,
          total_price: 90.00,
          description: "Pizza with tomato and mozzarella"
        },
        {
          id: "item_2", 
          name: "Coca Cola",
          quantity: 2,
          unit_price: 5.50,
          total_price: 11.00,
          size: "350ml"
        }
      ],
      public: {
        vendorId: "vendor_123",
        vendorName: "Pizza Place",
        cartTotal: 101.00,
        deliveryTotal: 10.50,
        taxTotal: 15.00,
        serviceFeeTotal: 5.00,
        discountTotal: 0
      },
      // Additional unknown fields that should be allowed
      customField1: "some custom value",
      customField2: {
        nestedCustom: "nested value"
      }
    },
    // Additional unknown fields at root level
    extraField: "should be allowed",
    metadata: {
      source: "mobile_app",
      version: "2.1.0"
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
    console.log(`Status Message: ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n=== Response Body ===');
      console.log(data);
      
      try {
        const parsed = JSON.parse(data);
        console.log('\n=== Parsed Response ===');
        console.log(JSON.stringify(parsed, null, 2));
        
        if (parsed.success) {
          console.log('\n✅ SUCCESS: Payment created with orderDetails.items field!');
        } else {
          console.log('\n❌ FAILED: Payment creation failed');
          if (parsed.errors) {
            console.log('Errors:', parsed.errors);
          }
        }
      } catch (e) {
        console.log('\n❌ Could not parse JSON response');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Problem with request: ${e.message}`);
  });

  req.write(postData);
  req.end();
};

console.log('🧪 Testing payment endpoint with orderDetails.items field...');
testPaymentWithItems();