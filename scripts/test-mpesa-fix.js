const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key-123';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testMpesaFix() {
  try {
    console.log('🧪 Testando correção do erro 500 do M-Pesa...\n');

    // 1. Criar pagamento
    console.log('1️⃣ Criando pagamento...');
    const createResponse = await makeRequest('POST', '/api/v1/payments/create', {
      amount: 25.00,
      currency: 'MZN',
      customer: {
        phone: '+258841234567',
        name: 'Teste M-Pesa',
        email: 'teste@example.com'
      },
      returnUrl: 'https://example.com/success'
    });

    console.log('Status:', createResponse.status);
    console.log('Response:', JSON.stringify(createResponse.data, null, 2));

    if (createResponse.status === 201 && createResponse.data.success) {
      const paymentId = createResponse.data.data.externalPayment.id;
      console.log('\n✅ Pagamento criado! ID:', paymentId);

      // 2. Testar M-Pesa
      console.log('\n2️⃣ Testando processamento M-Pesa...');
      const mpesaResponse = await makeRequest('POST', '/api/v1/payments/process-mpesa', {
        paymentId: paymentId,
        phone: '+258841234567',
        amount: 25.00,
        currency: 'MZN'
      });

      console.log('Status M-Pesa:', mpesaResponse.status);
      console.log('Response M-Pesa:', JSON.stringify(mpesaResponse.data, null, 2));

      if (mpesaResponse.status === 200) {
        console.log('\n🎉 SUCESSO! M-Pesa funcionando sem erro 500!');
      } else {
        console.log('\n❌ M-Pesa ainda com erro. Status:', mpesaResponse.status);
      }
    } else {
      console.log('\n❌ Erro ao criar pagamento');
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

// Aguardar servidor iniciar
setTimeout(() => {
  testMpesaFix();
}, 3000);
