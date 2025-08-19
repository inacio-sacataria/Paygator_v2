const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key-123'; // Substitua pela sua chave API real

async function testTaxIdFix() {
  try {
    console.log('🧪 Testando correção do campo taxId...\n');

    // Request que estava falhando anteriormente
    const testRequest = {
      "paymentId": "01K22BGXQDH4FVQ5E9HG0TNHGQ1",
      "paymentMethod": "grupgo1",
      "amount": 40,
      "currency": "EUR",
      "customer": {
        "phone": "251911223344",
        "name": "Anatol"
      },
      "locale": "en",
      "returnUrl": "https://copy-preprod-ua.stage.foodbro.link/api/payment-gateway-callback/verify-payment/CUSTOM/01K22BGXQDH4FVQ5E9HG0TNHGQ",
      "orderDetails": {
        "orderId": "144522",
        "public": {
          "vendorId": "695",
          "vendorName": "EatnGo",
          "cartTotal": 36.00,
          "deliveryTotal": 1,
          "taxTotal": 3.46,
          "serviceFeeTotal": 3.00,
          "discountTotal": 0
        },
        "internal": {
          "vendorMerchant": {
            "id": "01HV8V6NESPJVY0VPKJR8TY3MA",
            "externalId": "b9fb6a42-6f29-4953-a664-c266b4d4dca7",
            "businessType": "COMPANY",
            "taxId": "", // Campo que estava causando problema
            "name": "123",
            "address": {
              "addressLine": "123, 12312, 123, 12345, LV",
              "city": "123",
              "countryCode": "LV",
              "zip": "12345"
            },
            "phone": "3872419869928",
            "email": "ivan.seleznov+eg@playfood.com",
            "active": true,
            "data": {}
          },
          "vendorShare": 30.00
        }
      }
    };

    console.log('1️⃣ Enviando request com taxId vazio...');
    console.log(`   taxId: "${testRequest.orderDetails.internal.vendorMerchant.taxId}"`);
    
    const response = await axios.post(`${BASE_URL}/api/v1/payments/create`, testRequest, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Sucesso! Pagamento criado com taxId vazio');
      console.log(`   ID: ${response.data.data.externalPayment.id}`);
      console.log(`   Link: ${response.data.data.link}`);
      console.log(`   Tipo: ${response.data.data.responseType}`);
    } else {
      console.log('❌ Falhou:', response.data.message);
      if (response.data.errors) {
        response.data.errors.forEach(error => console.log(`   - ${error}`));
      }
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
  }
}

async function testDifferentTaxIdValues() {
  console.log('\n🧪 Testando diferentes valores para taxId...\n');

  const testValues = [
    { value: "", description: "String vazia" },
    { value: null, description: "Null" },
    { value: "123456789", description: "String válida" },
    { value: undefined, description: "Undefined" }
  ];

  for (const test of testValues) {
    try {
      console.log(`Testando: ${test.description} (${test.value})`);
      
      const testRequest = {
        "paymentId": `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        "paymentMethod": "test",
        "amount": 10,
        "currency": "EUR",
        "customer": {
          "phone": "123456789",
          "name": "Test User"
        },
        "returnUrl": "https://example.com/success",
        "orderDetails": {
          "orderId": "test123",
          "public": {
            "vendorId": "test",
            "vendorName": "Test Vendor"
          },
          "internal": {
            "vendorMerchant": {
              "id": "test_id",
              "businessType": "COMPANY",
              "taxId": test.value,
              "name": "Test Merchant"
            }
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/api/v1/payments/create`, testRequest, {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log(`   ✅ ${test.description}: Sucesso`);
      } else {
        console.log(`   ❌ ${test.description}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`   ❌ ${test.description}: Erro - ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes de correção do taxId...\n');
  
  await testTaxIdFix();
  await testDifferentTaxIdValues();
  
  console.log('\n✨ Testes concluídos!');
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testTaxIdFix,
  testDifferentTaxIdValues,
  runAllTests
};
