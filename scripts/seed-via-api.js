const http = require('http');

// Dados de exemplo para popular via API
const samplePayments = [
  {
    paymentId: 'pay_' + Math.random().toString(36).substr(2, 9),
    externalPaymentId: 123456,
    paymentMethod: 'credit_card',
    paymentMethodId: null,
    amount: 51.75,
    currency: 'BRL',
    customer: {
      email: 'joao.silva@email.com',
      phone: '+55-11-99999-0001',
      name: 'João Silva',
      billingAddress: {
        countryCode: 'BR',
        stateCode: 'SP',
        city: 'São Paulo',
        postcode: '01000-000',
        street1: 'Rua das Flores, 123',
        street2: 'Apto 45'
      },
      external: {
        id: 'cust_001',
        data: {
          loyaltyPoints: 150,
          memberSince: '2023-01-15'
        }
      }
    },
    locale: 'pt-BR',
    returnUrl: 'https://example.com/payment/success',
    orderDetails: {
      orderId: 'ORD-20241201-001',
      public: {
        vendorId: 'vendor_001',
        vendorName: 'Loja Exemplo',
        cartTotal: 45.00,
        deliveryTotal: 5.00,
        taxTotal: 1.75,
        serviceFeeTotal: 0.00,
        discountTotal: 0.00
      },
      internal: {
        vendorMerchant: {
          id: 'merch_001',
          externalId: 'ext_merch_001',
          businessType: 'INDIVIDUAL',
          taxId: '12345678901',
          name: 'Loja Exemplo LTDA',
          address: {
            addressLine: '456 Business Ave',
            city: 'São Paulo',
            countryCode: 'BR',
            zip: '01000-000'
          },
          phone: '+55-11-99999-9999',
          email: 'contato@lojaexemplo.com',
          active: true,
          data: {
            companyData: {
              registrationNumber: 'SP123456789',
              businessLicense: 'BL-2023-001'
            },
            merchantData: {
              processingVolume: 50000,
              averageTicket: 25.50
            }
          }
        },
        vendorShare: 85.5
      }
    }
  },
  {
    paymentId: 'pay_' + Math.random().toString(36).substr(2, 9),
    externalPaymentId: 123457,
    paymentMethod: 'pix',
    paymentMethodId: null,
    amount: 32.50,
    currency: 'BRL',
    customer: {
      email: 'maria.santos@email.com',
      name: 'Maria Santos',
      phone: '+55-11-99999-0002',
      billingAddress: {
        countryCode: 'BR',
        stateCode: 'RJ',
        city: 'Rio de Janeiro',
        postcode: '20000-000',
        street1: 'Av. Copacabana, 456'
      },
      external: {
        id: 'cust_002',
        data: {
          loyaltyPoints: 75,
          memberSince: '2023-06-01'
        }
      }
    },
    locale: 'pt-BR',
    returnUrl: 'https://example.com/payment/success',
    orderDetails: {
      orderId: 'ORD-20241201-002',
      public: {
        vendorId: 'vendor_002',
        vendorName: 'Pizzaria Bella',
        cartTotal: 29.50,
        deliveryTotal: 3.00,
        taxTotal: 0.00,
        serviceFeeTotal: 0.00,
        discountTotal: 0.00
      },
      internal: {
        vendorMerchant: {
          id: 'merch_002',
          externalId: 'ext_merch_002',
          businessType: 'INDIVIDUAL',
          taxId: '98765432100',
          name: 'Pizzaria Bella ME',
          address: {
            addressLine: '789 Food Street',
            city: 'Rio de Janeiro',
            countryCode: 'BR',
            zip: '20000-000'
          },
          phone: '+55-21-99999-9999',
          email: 'contato@pizzariabella.com',
          active: true,
          data: {
            companyData: {
              registrationNumber: 'RJ987654321',
              businessLicense: 'BL-2023-002'
            },
            merchantData: {
              processingVolume: 30000,
              averageTicket: 35.00
            }
          }
        },
        vendorShare: 90.0
      }
    }
  },
  {
    paymentId: 'pay_' + Math.random().toString(36).substr(2, 9),
    externalPaymentId: 123458,
    paymentMethod: 'debit_card',
    paymentMethodId: null,
    amount: 89.00,
    currency: 'BRL',
    customer: {
      email: 'pedro.oliveira@email.com',
      name: 'Pedro Oliveira',
      phone: '+55-11-99999-0003',
      billingAddress: {
        countryCode: 'BR',
        stateCode: 'MG',
        city: 'Belo Horizonte',
        postcode: '30000-000',
        street1: 'Rua da Liberdade, 789'
      },
      external: {
        id: 'cust_003',
        data: {
          loyaltyPoints: 200,
          memberSince: '2022-12-01'
        }
      }
    },
    locale: 'pt-BR',
    returnUrl: 'https://example.com/payment/success',
    orderDetails: {
      orderId: 'ORD-20241201-003',
      public: {
        vendorId: 'vendor_003',
        vendorName: 'Burger House',
        cartTotal: 82.00,
        deliveryTotal: 7.00,
        taxTotal: 0.00,
        serviceFeeTotal: 0.00,
        discountTotal: 0.00
      },
      internal: {
        vendorMerchant: {
          id: 'merch_003',
          externalId: 'ext_merch_003',
          businessType: 'INDIVIDUAL',
          taxId: '11223344556',
          name: 'Burger House Grill',
          address: {
            addressLine: '321 Burger Lane',
            city: 'Belo Horizonte',
            countryCode: 'BR',
            zip: '30000-000'
          },
          phone: '+55-31-99999-9999',
          email: 'contato@burgerhouse.com',
          active: true,
          data: {
            companyData: {
              registrationNumber: 'MG112233445',
              businessLicense: 'BL-2023-003'
            },
            merchantData: {
              processingVolume: 40000,
              averageTicket: 45.00
            }
          }
        },
        vendorShare: 88.0
      }
    }
  },
  {
    paymentId: 'pay_' + Math.random().toString(36).substr(2, 9),
    paymentMethod: 'credit_card',
    amount: 125.00,
    currency: 'BRL',
    customer: {
      email: 'ana.costa@email.com',
      name: 'Ana Costa',
      phone: '+55-11-99999-0004',
      billingAddress: {
        countryCode: 'BR',
        stateCode: 'RS',
        city: 'Porto Alegre',
        postcode: '90000-000',
        street1: 'Av. Ipiranga, 321'
      }
    },
    locale: 'pt-BR',
    orderDetails: {
      orderId: 'ORD-20241201-004'
    }
  },
  {
    paymentId: 'pay_' + Math.random().toString(36).substr(2, 9),
    paymentMethod: 'online',
    amount: 67.50,
    currency: 'BRL',
    customer: {
      email: 'carlos.lima@email.com',
      name: 'Carlos Lima',
      phone: '+55-11-99999-0005',
      billingAddress: {
        countryCode: 'BR',
        stateCode: 'PR',
        city: 'Curitiba',
        postcode: '80000-000',
        street1: 'Rua XV de Novembro, 654'
      }
    },
    locale: 'pt-BR',
    orderDetails: {
      orderId: 'ORD-20241201-005'
    }
  }
];

function makeApiRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/payments/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-API-Key': 'playfood_3e94628438fd9e7e873d40184cc9f09a0fbdd22a421a0078' // Chave fornecida pelo usuário
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(responseData)
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: { raw: responseData }
            });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function seedViaApi() {
  console.log('🚀 Iniciando população da base de dados via API PlayFood...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < samplePayments.length; i++) {
    const payment = samplePayments[i];
    
    try {
      console.log(`📤 Criando pagamento ${i + 1}/${samplePayments.length}: ${payment.customer.name} - R$ ${payment.amount}`);
      
      const response = await makeApiRequest(payment);
      console.log(`✅ Sucesso: Status ${response.status}`);
      successCount++;
      
      // Aguardar um pouco entre requests para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 Resumo:');
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📈 Total: ${samplePayments.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Base de dados populada com sucesso!');
    console.log('🌐 Acesse: http://localhost:3000/admin/login');
    console.log('🔑 Senha: admin123');
  } else {
    console.log('\n⚠️  Verifique se o servidor e a base de dados estão configurados corretamente');
  }
}

// Aguardar um pouco para o servidor iniciar e depois executar
setTimeout(() => {
  seedViaApi().catch(console.error);
}, 2000); 