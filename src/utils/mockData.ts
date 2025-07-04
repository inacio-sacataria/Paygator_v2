import { v4 as uuidv4 } from 'uuid';
import {
  PlayfoodPaymentCreateRequest,
  PlayfoodCustomer,
  PlayfoodBillingAddress,
  PlayfoodExternalData,
  PlayfoodOrderDetails,
  PlayfoodPublicOrderData,
  PlayfoodInternalOrderData,
  PlayfoodVendorMerchant,
  PlayfoodMerchantAddress,
  PlayfoodMerchantData,
  PlayfoodExternalPayment,
  PlayfoodCardData,
  PlayfoodPaymentMethodData,
  PlayfoodWebhookRequest,
  PlayfoodWebhookData
} from '../types/playfoodPayment';

// Dados mock para testes da API Playfood Payment Provider

export const mockBillingAddress: PlayfoodBillingAddress = {
  countryCode: 'US',
  stateCode: 'CA',
  city: 'Los Angeles',
  postcode: '90001',
  street1: '123 Main Street',
  street2: 'Apt 4B'
};

export const mockExternalData: PlayfoodExternalData = {
  id: 'cust_ext_12345',
  data: {
    loyaltyPoints: 150,
    memberSince: '2023-01-15',
    preferences: {
      language: 'en',
      currency: 'USD'
    }
  }
};

export const mockCustomer: PlayfoodCustomer = {
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  name: 'John Doe',
  billingAddress: mockBillingAddress,
  external: mockExternalData
};

export const mockMerchantAddress: PlayfoodMerchantAddress = {
  addressLine: '456 Business Ave',
  city: 'San Francisco',
  countryCode: 'US',
  zip: '94102'
};

export const mockMerchantData: PlayfoodMerchantData = {
  companyData: {
    registrationNumber: 'CA123456789',
    businessLicense: 'BL-2023-001',
    taxExempt: false
  },
  merchantData: {
    processingVolume: 50000,
    averageTicket: 25.50,
    riskLevel: 'low'
  }
};

export const mockVendorMerchant: PlayfoodVendorMerchant = {
  id: 'merch_001',
  externalId: 'ext_merch_001',
  businessType: 'INDIVIDUAL',
  taxId: '12-3456789',
  name: 'Pizza Palace',
  address: mockMerchantAddress,
  phone: '+1-555-987-6543',
  email: 'contact@pizzapalace.com',
  active: true,
  data: mockMerchantData
};

export const mockPublicOrderData: PlayfoodPublicOrderData = {
  vendorId: 'vendor_001',
  vendorName: 'Pizza Palace',
  cartTotal: 45.00,
  deliveryTotal: 5.00,
  taxTotal: 4.50,
  serviceFeeTotal: 2.25,
  discountTotal: 5.00
};

export const mockInternalOrderData: PlayfoodInternalOrderData = {
  vendorMerchant: mockVendorMerchant,
  vendorShare: 85.5
};

export const mockOrderDetails: PlayfoodOrderDetails = {
  orderId: `order_${uuidv4().replace(/-/g, '')}`,
  public: mockPublicOrderData,
  internal: mockInternalOrderData
};

export const mockExternalPayment: PlayfoodExternalPayment = {
  id: `ext_pay_${uuidv4().replace(/-/g, '')}`,
  data: {
    gateway: 'playfood',
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    sessionId: `sess_${uuidv4().replace(/-/g, '')}`,
    metadata: {
      source: 'web',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ipAddress: '192.168.1.100'
    }
  }
};

export const mockCardData: PlayfoodCardData = {
  token: `tok_${uuidv4().replace(/-/g, '')}`,
  expiryYear: 2025,
  expiryMonth: 12,
  holder: 'John Doe',
  last4Digits: '4242',
  brand: 'Visa',
  paymentOptionCode: 'visa',
  data: {
    cardType: 'credit',
    country: 'US',
    funding: 'credit'
  }
};

export const mockPaymentMethodData: PlayfoodPaymentMethodData = {
  card: mockCardData
};

export const mockWebhookData: PlayfoodWebhookData = {
  paymentId: `pay_${uuidv4().replace(/-/g, '')}`,
  status: 'succeeded',
  amount: 51.75,
  amountCaptured: 51.75,
  amountRefunded: 0.00,
  currency: 'USD',
  customer: mockCustomer,
  paymentMethodData: mockPaymentMethodData,
  externalPayment: mockExternalPayment
};

// Exemplo completo de request para criar pagamento
export const mockCreatePaymentRequest: PlayfoodPaymentCreateRequest = {
  paymentId: `pay_${uuidv4().replace(/-/g, '')}`,
  externalPaymentId: null,
  paymentMethod: 'credit_card',
  paymentMethodId: null,
  amount: 51.75,
  currency: 'USD',
  customer: mockCustomer,
  locale: 'en-US',
  returnUrl: 'https://example.com/payment/success',
  orderDetails: mockOrderDetails
};

// Exemplo de request para webhook
export const mockWebhookRequest: PlayfoodWebhookRequest = {
  externalPaymentId: mockExternalPayment.id,
  webhookEventId: uuidv4(),
  eventAction: 'PAYMENT_AUTHORIZED',
  created: new Date().toISOString(),
  type: 'WEBHOOK',
  data: mockWebhookData
};

// Função para gerar dados mock dinâmicos
export const generateMockPaymentRequest = (): PlayfoodPaymentCreateRequest => {
  const paymentId = `pay_${uuidv4().replace(/-/g, '')}`;
  const amount = Math.round((Math.random() * 100 + 10) * 100) / 100; // Entre $10 e $110
  
  return {
    paymentId,
    externalPaymentId: null,
    paymentMethod: 'credit_card',
    paymentMethodId: null,
    amount,
    currency: 'USD',
    customer: {
      ...mockCustomer,
      email: `customer_${Date.now()}@example.com`,
      name: `Customer ${Math.floor(Math.random() * 1000)}`
    },
    locale: 'en-US',
    returnUrl: `https://example.com/payment/success?paymentId=${paymentId}`,
    orderDetails: {
      ...mockOrderDetails,
      orderId: `order_${uuidv4().replace(/-/g, '')}`,
      public: {
        ...mockPublicOrderData,
        cartTotal: amount * 0.9,
        deliveryTotal: amount * 0.1,
        taxTotal: amount * 0.08,
        serviceFeeTotal: amount * 0.02
      }
    }
  };
};

export const generateMockWebhookRequest = (): PlayfoodWebhookRequest => {
  const webhookEventId = uuidv4();
  const externalPaymentId = `ext_pay_${uuidv4().replace(/-/g, '')}`;
  const amount = Math.round((Math.random() * 100 + 10) * 100) / 100;
  
  return {
    externalPaymentId,
    webhookEventId,
    eventAction: 'PAYMENT_AUTHORIZED',
    created: new Date().toISOString(),
    type: 'WEBHOOK',
    data: {
      paymentId: `pay_${uuidv4().replace(/-/g, '')}`,
      status: 'succeeded',
      amount,
      amountCaptured: amount,
      amountRefunded: 0.00,
      currency: 'USD',
      customer: mockCustomer,
      paymentMethodData: mockPaymentMethodData,
      externalPayment: {
        id: externalPaymentId,
        data: {
          gateway: 'playfood',
          status: 'succeeded',
          createdAt: new Date().toISOString(),
          transactionId: `txn_${uuidv4().replace(/-/g, '')}`
        }
      }
    }
  };
};

// Dados mock para diferentes cenários
export const mockScenarios = {
  success: {
    status: 'succeeded',
    amount: 51.75,
    amountCaptured: 51.75,
    amountRefunded: 0.00
  },
  pending: {
    status: 'pending',
    amount: 51.75,
    amountCaptured: 0.00,
    amountRefunded: 0.00
  },
  failed: {
    status: 'failed',
    amount: 51.75,
    amountCaptured: 0.00,
    amountRefunded: 0.00,
    error: {
      errorMsg: 'Payment was declined by the bank',
      errorCode: 'PAYMENT_DECLINED'
    }
  },
  partialRefund: {
    status: 'succeeded',
    amount: 51.75,
    amountCaptured: 51.75,
    amountRefunded: 25.00
  }
};

// Array de pagamentos mock
export const mockPayments = Array.from({ length: 10 }, () => generateMockPaymentRequest());

// Array de pedidos mock (usando orderDetails dos pagamentos)
export const mockOrders = mockPayments.map(p => p.orderDetails); 