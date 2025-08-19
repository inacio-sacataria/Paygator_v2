const Joi = require('joi');

// Schema de validação para criar pagamento - apenas amount é obrigatório
const createPaymentSchema = Joi.object({
  paymentId: Joi.string().optional(),
  externalPaymentId: Joi.number().optional(),
  paymentMethod: Joi.string().optional().allow(null),
  paymentMethodId: Joi.string().optional().allow(null),
  amount: Joi.number().positive().required(),
  currency: Joi.string().optional(),
  customer: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    name: Joi.string().optional(),
    billingAddress: Joi.object({
      countryCode: Joi.string().optional(),
      stateCode: Joi.string().optional(),
      city: Joi.string().optional(),
      postcode: Joi.string().optional(),
      street1: Joi.string().optional(),
      street2: Joi.string().optional().allow('')
    }).unknown(true).optional(),
    external: Joi.object({
      id: Joi.string().optional(),
      data: Joi.any().optional()
    }).unknown(true).optional()
  }).unknown(true).optional(),
  locale: Joi.string().optional(),
  returnUrl: Joi.string().uri().optional(),
  orderDetails: Joi.object({
    orderId: Joi.string().optional(),
    items: Joi.array().items(Joi.object().unknown(true)).optional(),
    public: Joi.object({
      vendorId: Joi.string().optional(),
      vendorName: Joi.string().optional(),
      cartTotal: Joi.number().optional(),
      deliveryTotal: Joi.number().optional(),
      taxTotal: Joi.number().optional(),
      serviceFeeTotal: Joi.number().optional(),
      discountTotal: Joi.number().optional().allow(null)
    }).unknown(true).optional(),
    internal: Joi.object({
      vendorMerchant: Joi.object({
        id: Joi.string().optional(),
        externalId: Joi.string().optional().allow(null, ''),
        businessType: Joi.string().valid('INDIVIDUAL', 'COMPANY').optional(),
        taxId: Joi.string().optional().allow(null, ''),
        name: Joi.string().optional(),
        address: Joi.object({
          addressLine: Joi.string().optional(),
          city: Joi.string().optional(),
          countryCode: Joi.string().optional().allow(null),
          zip: Joi.string().optional()
        }).unknown(true).optional(),
        phone: Joi.string().optional(),
        email: Joi.string().email().optional(),
        active: Joi.boolean().optional(),
        data: Joi.object({
          companyData: Joi.any().optional(),
          merchantData: Joi.any().optional()
        }).unknown(true).optional()
      }).unknown(true).optional(),
      vendorShare: Joi.number().optional()
    }).unknown(true).optional()
  }).unknown(true).optional()
}).unknown(true);

// Teste com o request que estava falhando
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
        "taxId": "",
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

console.log('🧪 Testando validação do schema...\n');

try {
  const { error, value } = createPaymentSchema.validate(testRequest, { abortEarly: false });
  
  if (error) {
    console.log('❌ Validação falhou:');
    const errorMessages = error.details.map(detail => detail.message);
    errorMessages.forEach(msg => console.log(`   - ${msg}`));
  } else {
    console.log('✅ Validação passou com sucesso!');
    console.log('Dados validados:', JSON.stringify(value, null, 2));
  }
} catch (err) {
  console.error('❌ Erro durante validação:', err.message);
}

// Teste específico para o campo taxId
console.log('\n🧪 Testando especificamente o campo taxId...\n');

const taxIdTests = [
  { value: "123456789", description: "String válida" },
  { value: "", description: "String vazia" },
  { value: null, description: "Null" },
  { value: undefined, description: "Undefined" }
];

taxIdTests.forEach(test => {
  try {
    const testSchema = Joi.object({
      taxId: Joi.string().optional().allow(null, '')
    });
    
    const { error } = testSchema.validate({ taxId: test.value });
    
    if (error) {
      console.log(`❌ ${test.description} (${test.value}): ${error.message}`);
    } else {
      console.log(`✅ ${test.description} (${test.value}): Válido`);
    }
  } catch (err) {
    console.log(`❌ ${test.description} (${test.value}): Erro - ${err.message}`);
  }
});

console.log('\n✨ Teste de validação concluído!');
