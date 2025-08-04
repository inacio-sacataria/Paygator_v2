import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

// Schemas de validação para a API Playfood Payment Provider

// Schema para endereço de cobrança
const billingAddressSchema = Joi.object({
  countryCode: Joi.string().required().min(2).max(3).messages({
    'string.empty': 'Country code is required',
    'string.min': 'Country code must be at least 2 characters',
    'string.max': 'Country code must be at most 3 characters'
  }),
  stateCode: Joi.string().required().min(2).max(3).messages({
    'string.empty': 'State code is required',
    'string.min': 'State code must be at least 2 characters',
    'string.max': 'State code must be at most 3 characters'
  }),
  city: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'City is required',
    'string.min': 'City must be at least 1 character',
    'string.max': 'City must be at most 100 characters'
  }),
  postcode: Joi.string().required().min(3).max(20).messages({
    'string.empty': 'Postcode is required',
    'string.min': 'Postcode must be at least 3 characters',
    'string.max': 'Postcode must be at most 20 characters'
  }),
  street1: Joi.string().required().min(1).max(200).messages({
    'string.empty': 'Street address is required',
    'string.min': 'Street address must be at least 1 character',
    'string.max': 'Street address must be at most 200 characters'
  }),
  street2: Joi.string().optional().allow(null, '').max(200).messages({
    'string.max': 'Street address 2 must be at most 200 characters'
  })
});

// Schema para dados externos
const externalDataSchema = Joi.object({
  id: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'External ID is required',
    'string.min': 'External ID must be at least 1 character',
    'string.max': 'External ID must be at most 100 characters'
  }),
  data: Joi.any().optional().allow(null)
});

// Schema para cliente
const customerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'Email is required'
  }),
  phone: Joi.string().required().min(10).max(20).pattern(/^[\+]?[0-9\s\-\(\)]+$/).messages({
    'string.empty': 'Phone is required',
    'string.min': 'Phone must be at least 10 characters',
    'string.max': 'Phone must be at most 20 characters',
    'string.pattern.base': 'Invalid phone format'
  }),
  name: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name must be at most 100 characters'
  }),
  billingAddress: billingAddressSchema.required(),
  external: externalDataSchema.required()
});

// Schema para endereço do merchant
const merchantAddressSchema = Joi.object({
  addressLine: Joi.string().required().min(1).max(200).messages({
    'string.empty': 'Address line is required',
    'string.min': 'Address line must be at least 1 character',
    'string.max': 'Address line must be at most 200 characters'
  }),
  city: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'City is required',
    'string.min': 'City must be at least 1 character',
    'string.max': 'City must be at most 100 characters'
  }),
  countryCode: Joi.string().optional().allow(null).min(2).max(3).messages({
    'string.min': 'Country code must be at least 2 characters',
    'string.max': 'Country code must be at most 3 characters'
  }),
  zip: Joi.string().required().min(3).max(20).messages({
    'string.empty': 'ZIP code is required',
    'string.min': 'ZIP code must be at least 3 characters',
    'string.max': 'ZIP code must be at most 20 characters'
  })
});

// Schema para dados do merchant
const merchantDataSchema = Joi.object({
  companyData: Joi.any().optional().allow(null),
  merchantData: Joi.any().optional().allow(null)
});

// Schema para vendor merchant
const vendorMerchantSchema = Joi.object({
  id: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Merchant ID is required',
    'string.min': 'Merchant ID must be at least 1 character',
    'string.max': 'Merchant ID must be at most 100 characters'
  }),
  externalId: Joi.string().optional().allow(null, '').max(100).messages({
    'string.max': 'External ID must be at most 100 characters'
  }),
  businessType: Joi.string().valid('INDIVIDUAL').required().messages({
    'any.only': 'Business type must be INDIVIDUAL',
    'string.empty': 'Business type is required'
  }),
  taxId: Joi.string().optional().allow(null, '').min(5).max(50).pattern(/^[0-9\-\.]+$/).messages({
    'string.min': 'Tax ID must be at least 5 characters',
    'string.max': 'Tax ID must be at most 50 characters',
    'string.pattern.base': 'Invalid tax ID format'
  }),
  name: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Merchant name is required',
    'string.min': 'Merchant name must be at least 1 character',
    'string.max': 'Merchant name must be at most 100 characters'
  }),
  address: merchantAddressSchema.required(),
  phone: Joi.string().required().min(10).max(20).pattern(/^[\+]?[0-9\s\-\(\)]+$/).messages({
    'string.empty': 'Phone is required',
    'string.min': 'Phone must be at least 10 characters',
    'string.max': 'Phone must be at most 20 characters',
    'string.pattern.base': 'Invalid phone format'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'Email is required'
  }),
  active: Joi.boolean().required(),
  data: merchantDataSchema.required()
});

// Schema para dados públicos do pedido
const publicOrderDataSchema = Joi.object({
  vendorId: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Vendor ID is required',
    'string.min': 'Vendor ID must be at least 1 character',
    'string.max': 'Vendor ID must be at most 100 characters'
  }),
  vendorName: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Vendor name is required',
    'string.min': 'Vendor name must be at least 1 character',
    'string.max': 'Vendor name must be at most 100 characters'
  }),
  cartTotal: Joi.number().positive().required().messages({
    'number.base': 'Cart total must be a number',
    'number.positive': 'Cart total must be positive',
    'any.required': 'Cart total is required'
  }),
  deliveryTotal: Joi.number().min(0).required().messages({
    'number.base': 'Delivery total must be a number',
    'number.min': 'Delivery total must be non-negative',
    'any.required': 'Delivery total is required'
  }),
  taxTotal: Joi.number().min(0).required().messages({
    'number.base': 'Tax total must be a number',
    'number.min': 'Tax total must be non-negative',
    'any.required': 'Tax total is required'
  }),
  serviceFeeTotal: Joi.number().min(0).required().messages({
    'number.base': 'Service fee total must be a number',
    'number.min': 'Service fee total must be non-negative',
    'any.required': 'Service fee total is required'
  }),
  discountTotal: Joi.number().min(0).optional().allow(null).messages({
    'number.base': 'Discount total must be a number',
    'number.min': 'Discount total must be non-negative'
  })
});

// Schema para dados internos do pedido
const internalOrderDataSchema = Joi.object({
  vendorMerchant: vendorMerchantSchema.required(),
  vendorShare: Joi.number().min(0).max(100).required().messages({
    'number.base': 'Vendor share must be a number',
    'number.min': 'Vendor share must be at least 0',
    'number.max': 'Vendor share must be at most 100',
    'any.required': 'Vendor share is required'
  })
});

// Schema para detalhes do pedido
const orderDetailsSchema = Joi.object({
  orderId: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Order ID is required',
    'string.min': 'Order ID must be at least 1 character',
    'string.max': 'Order ID must be at most 100 characters'
  }),
  public: publicOrderDataSchema.required(),
  internal: internalOrderDataSchema.required()
});

// Schema para external payment
const externalPaymentSchema = Joi.object({
  id: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'External payment ID is required',
    'string.min': 'External payment ID must be at least 1 character',
    'string.max': 'External payment ID must be at most 100 characters'
  }),
  data: Joi.object().required().messages({
    'object.base': 'External payment data must be an object',
    'any.required': 'External payment data is required'
  })
});

// Schema para dados do cartão
const cardDataSchema = Joi.object({
  token: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Card token is required',
    'string.min': 'Card token must be at least 1 character',
    'string.max': 'Card token must be at most 100 characters'
  }),
  expiryYear: Joi.number().integer().min(2020).max(2030).required().messages({
    'number.base': 'Expiry year must be a number',
    'number.integer': 'Expiry year must be an integer',
    'number.min': 'Expiry year must be at least 2020',
    'number.max': 'Expiry year must be at most 2030',
    'any.required': 'Expiry year is required'
  }),
  expiryMonth: Joi.number().integer().min(1).max(12).required().messages({
    'number.base': 'Expiry month must be a number',
    'number.integer': 'Expiry month must be an integer',
    'number.min': 'Expiry month must be at least 1',
    'number.max': 'Expiry month must be at most 12',
    'any.required': 'Expiry month is required'
  }),
  holder: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Card holder is required',
    'string.min': 'Card holder must be at least 1 character',
    'string.max': 'Card holder must be at most 100 characters'
  }),
  last4Digits: Joi.string().required().length(4).pattern(/^[0-9]{4}$/).messages({
    'string.empty': 'Last 4 digits are required',
    'string.length': 'Last 4 digits must be exactly 4 characters',
    'string.pattern.base': 'Last 4 digits must be numeric'
  }),
  brand: Joi.string().optional().allow(null).max(50).messages({
    'string.max': 'Card brand must be at most 50 characters'
  }),
  paymentOptionCode: Joi.string().optional().allow(null).max(50).messages({
    'string.max': 'Payment option code must be at most 50 characters'
  }),
  data: Joi.any().optional().allow(null)
});

// Schema para dados do método de pagamento
const paymentMethodDataSchema = Joi.object({
  card: cardDataSchema.optional()
});

// Schema para erro
const errorSchema = Joi.object({
  errorMsg: Joi.string().required().min(1).max(500).messages({
    'string.empty': 'Error message is required',
    'string.min': 'Error message must be at least 1 character',
    'string.max': 'Error message must be at most 500 characters'
  }),
  errorCode: Joi.string().required().min(1).max(50).messages({
    'string.empty': 'Error code is required',
    'string.min': 'Error code must be at least 1 character',
    'string.max': 'Error code must be at most 50 characters'
  })
});

// Schema para dados do webhook
const webhookDataSchema = Joi.object({
  paymentId: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Payment ID is required',
    'string.min': 'Payment ID must be at least 1 character',
    'string.max': 'Payment ID must be at most 100 characters'
  }),
  status: Joi.string().valid('succeeded', 'pending', 'failed', 'cancelled').required().messages({
    'any.only': 'Status must be one of: succeeded, pending, failed, cancelled',
    'string.empty': 'Status is required'
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  }),
  amountCaptured: Joi.number().min(0).required().messages({
    'number.base': 'Amount captured must be a number',
    'number.min': 'Amount captured must be non-negative',
    'any.required': 'Amount captured is required'
  }),
  amountRefunded: Joi.number().min(0).required().messages({
    'number.base': 'Amount refunded must be a number',
    'number.min': 'Amount refunded must be non-negative',
    'any.required': 'Amount refunded is required'
  }),
  currency: Joi.string().required().min(3).max(3).pattern(/^[A-Z]{3}$/).messages({
    'string.empty': 'Currency is required',
    'string.length': 'Currency must be exactly 3 characters',
    'string.pattern.base': 'Currency must be in ISO 4217 format (e.g., USD, EUR)'
  }),
  error: errorSchema.optional(),
  customer: customerSchema.required(),
  paymentMethodData: paymentMethodDataSchema.optional(),
  externalPayment: externalPaymentSchema.required()
});

// Schemas para cada endpoint

// 1. POST /payments/create
export const createPaymentSchema = Joi.object({
  paymentId: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Payment ID is required',
    'string.min': 'Payment ID must be at least 1 character',
    'string.max': 'Payment ID must be at most 100 characters'
  }),
  externalPaymentId: Joi.string().optional().allow(null).max(100).messages({
    'string.max': 'External payment ID must be at most 100 characters'
  }),
  paymentMethod: Joi.string().optional().allow(null).max(50).messages({
    'string.max': 'Payment method must be at most 50 characters'
  }),
  paymentMethodId: Joi.string().optional().allow(null).max(100).messages({
    'string.max': 'Payment method ID must be at most 100 characters'
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  }),
  currency: Joi.string().required().min(3).max(3).pattern(/^[A-Z]{3}$/).messages({
    'string.empty': 'Currency is required',
    'string.length': 'Currency must be exactly 3 characters',
    'string.pattern.base': 'Currency must be in ISO 4217 format (e.g., USD, EUR)'
  }),
  customer: customerSchema.required(),
  locale: Joi.string().required().min(2).max(10).pattern(/^[a-z]{2}(-[A-Z]{2})?$/).messages({
    'string.empty': 'Locale is required',
    'string.min': 'Locale must be at least 2 characters',
    'string.max': 'Locale must be at most 10 characters',
    'string.pattern.base': 'Invalid locale format (e.g., en-US, pt-BR)'
  }),
  returnUrl: Joi.string().uri().required().messages({
    'string.empty': 'Return URL is required',
    'string.uri': 'Return URL must be a valid URI'
  }),
  orderDetails: orderDetailsSchema.required()
});

// 2. POST /payments/info
export const paymentInfoSchema = Joi.object({
  paymentId: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Payment ID is required',
    'string.min': 'Payment ID must be at least 1 character',
    'string.max': 'Payment ID must be at most 100 characters'
  }),
  externalPayment: externalPaymentSchema.required()
});

// 3. POST /payments/capture
export const paymentCaptureSchema = Joi.object({
  paymentId: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Payment ID is required',
    'string.min': 'Payment ID must be at least 1 character',
    'string.max': 'Payment ID must be at most 100 characters'
  }),
  externalPayment: externalPaymentSchema.required(),
  amountToCapture: Joi.number().positive().required().messages({
    'number.base': 'Amount to capture must be a number',
    'number.positive': 'Amount to capture must be positive',
    'any.required': 'Amount to capture is required'
  })
});

// 4. POST /payments/refund
export const paymentRefundSchema = Joi.object({
  paymentId: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Payment ID is required',
    'string.min': 'Payment ID must be at least 1 character',
    'string.max': 'Payment ID must be at most 100 characters'
  }),
  externalPayment: externalPaymentSchema.required(),
  amountToRefund: Joi.number().positive().required().messages({
    'number.base': 'Amount to refund must be a number',
    'number.positive': 'Amount to refund must be positive',
    'any.required': 'Amount to refund is required'
  })
});

// 5. POST /merchants/register
export const merchantRegisterSchema = Joi.object({
  id: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Merchant ID is required',
    'string.min': 'Merchant ID must be at least 1 character',
    'string.max': 'Merchant ID must be at most 100 characters'
  }),
  externalId: Joi.string().optional().allow(null, '').max(100).messages({
    'string.max': 'External ID must be at most 100 characters'
  }),
  businessType: Joi.string().valid('INDIVIDUAL').required().messages({
    'any.only': 'Business type must be INDIVIDUAL',
    'string.empty': 'Business type is required'
  }),
  taxId: Joi.string().optional().allow(null, '').min(5).max(50).pattern(/^[0-9\-\.]+$/).messages({
    'string.min': 'Tax ID must be at least 5 characters',
    'string.max': 'Tax ID must be at most 50 characters',
    'string.pattern.base': 'Invalid tax ID format'
  }),
  name: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Merchant name is required',
    'string.min': 'Merchant name must be at least 1 character',
    'string.max': 'Merchant name must be at most 100 characters'
  }),
  address: merchantAddressSchema.required(),
  phone: Joi.string().required().min(10).max(20).pattern(/^[\+]?[0-9\s\-\(\)]+$/).messages({
    'string.empty': 'Phone is required',
    'string.min': 'Phone must be at least 10 characters',
    'string.max': 'Phone must be at most 20 characters',
    'string.pattern.base': 'Invalid phone format'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'Email is required'
  }),
  active: Joi.boolean().required(),
  companyData: Joi.any().optional().allow(null)
});

// 6. POST /transfers/create
export const transferCreateSchema = Joi.object({
  paymentId: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Payment ID is required',
    'string.min': 'Payment ID must be at least 1 character',
    'string.max': 'Payment ID must be at most 100 characters'
  }),
  externalPayment: externalPaymentSchema.required(),
  merchant: vendorMerchantSchema.required(),
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  })
});

// 7. POST /service/payments/webhook/v2/{paymentSettingsId}
export const webhookSchema = Joi.object({
  externalPaymentId: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'External payment ID is required',
    'string.min': 'External payment ID must be at least 1 character',
    'string.max': 'External payment ID must be at most 100 characters'
  }),
  webhookEventId: Joi.string().guid().required().messages({
    'string.empty': 'Webhook event ID is required',
    'string.guid': 'Webhook event ID must be a valid UUID'
  }),
  eventAction: Joi.string().valid('PAYMENT_AUTHORIZED', 'PAYMENT_CAPTURED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED', 'PAYMENT_CANCELLED').required().messages({
    'any.only': 'Event action must be one of: PAYMENT_AUTHORIZED, PAYMENT_CAPTURED, PAYMENT_FAILED, PAYMENT_REFUNDED, PAYMENT_CANCELLED',
    'string.empty': 'Event action is required'
  }),
  created: Joi.date().iso().required().messages({
    'date.base': 'Created must be a valid date',
    'date.format': 'Created must be in ISO 8601 format',
    'any.required': 'Created is required'
  }),
  type: Joi.string().valid('WEBHOOK').required().messages({
    'any.only': 'Type must be WEBHOOK',
    'string.empty': 'Type is required'
  }),
  data: webhookDataSchema.required()
});

// Schema para paymentSettingsId no path parameter
export const paymentSettingsIdSchema = Joi.string().required().min(1).max(100).messages({
  'string.empty': 'Payment settings ID is required',
  'string.min': 'Payment settings ID must be at least 1 character',
  'string.max': 'Payment settings ID must be at most 100 characters'
});

// Função para gerar UUID
export const generateUUID = (): string => uuidv4();

// Função para validar UUID
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}; 