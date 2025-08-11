// Tipos para a API Playfood Payment Provider

export interface PlayfoodPaymentCreateRequest {
  paymentId: string;
  externalPaymentId?: string | null;
  paymentMethod?: string | null;
  paymentMethodId?: string | null;
  amount: number;
  currency: string;
  customer: PlayfoodCustomer;
  locale: string;
  returnUrl: string;
  orderDetails: PlayfoodOrderDetails;
}

export interface PlayfoodCustomer {
  email: string;
  phone: string;
  name: string;
  billingAddress: PlayfoodBillingAddress;
  external: PlayfoodExternalData;
}

export interface PlayfoodBillingAddress {
  countryCode: string;
  stateCode: string;
  city: string;
  postcode: string;
  street1: string;
  street2: string;
}

export interface PlayfoodExternalData {
  id: string;
  data: any | null;
}

export interface PlayfoodOrderDetails {
  orderId: string;
  public: PlayfoodPublicOrderData;
  internal: PlayfoodInternalOrderData;
}

export interface PlayfoodPublicOrderData {
  vendorId: string;
  vendorName: string;
  cartTotal: number;
  deliveryTotal: number;
  taxTotal: number;
  serviceFeeTotal: number;
  discountTotal?: number | null;
}

export interface PlayfoodInternalOrderData {
  vendorMerchant: PlayfoodVendorMerchant;
  vendorShare: number;
}

export interface PlayfoodVendorMerchant {
  id: string;
  externalId?: string | null;
  businessType: 'INDIVIDUAL' | 'COMPANY';
  taxId?: string;
  name: string;
  address: PlayfoodMerchantAddress;
  phone: string;
  email: string;
  active: boolean;
  data: PlayfoodMerchantData;
}

export interface PlayfoodMerchantAddress {
  addressLine: string;
  city: string;
  countryCode?: string | null;
  zip: string;
}

export interface PlayfoodMerchantData {
  companyData: any | null;
  merchantData: any | null;
}

export interface PlayfoodPaymentCreateResponse {
  externalPayment: PlayfoodExternalPayment;
  responseType: 'IFRAME';
  link: string;
}

export interface PlayfoodExternalPayment {
  id: string;
  data: object;
}

export interface PlayfoodPaymentInfoRequest {
  paymentId: string;
  externalPayment: PlayfoodExternalPayment;
}

export interface PlayfoodPaymentInfoResponse {
  paymentId: string;
  status: 'succeeded' | 'pending' | 'failed' | 'cancelled';
  amount: number;
  amountReceived: number;
  amountCaptured: number;
  amountRefunded: number;
  currency: string;
  error?: PlayfoodError;
  customer: PlayfoodCustomer;
  paymentMethodData?: PlayfoodPaymentMethodData;
  externalPayment: PlayfoodExternalPayment;
}

export interface PlayfoodError {
  errorMsg: string;
  errorCode: string;
}

export interface PlayfoodPaymentMethodData {
  card?: PlayfoodCardData;
}

export interface PlayfoodCardData {
  token: string;
  expiryYear: number;
  expiryMonth: number;
  holder: string;
  last4Digits: string;
  brand?: string | null;
  paymentOptionCode?: string | null;
  data?: any | null;
}

export interface PlayfoodPaymentCaptureRequest {
  paymentId: string;
  externalPayment: PlayfoodExternalPayment;
  amountToCapture: number;
}

export interface PlayfoodPaymentCaptureResponse {
  externalPayment: PlayfoodExternalPayment;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
  amountCaptured: number;
  amountRefunded: number;
}

export interface PlayfoodPaymentRefundRequest {
  paymentId: string;
  externalPayment: PlayfoodExternalPayment;
  amountToRefund: number;
}

export interface PlayfoodPaymentRefundResponse {
  externalPayment: PlayfoodExternalPayment;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
  amountCaptured: number;
  amountRefunded: number;
}

export interface PlayfoodMerchantRegisterRequest {
  id: string;
  externalId?: string | null;
  businessType: 'INDIVIDUAL' | 'COMPANY';
  taxId?: string;
  name: string;
  address: PlayfoodMerchantAddress;
  phone: string;
  email: string;
  active: boolean;
  companyData?: any | null;
}

export interface PlayfoodMerchantRegisterResponse {
  externalId: string;
  merchantData?: any | null;
}

export interface PlayfoodTransferCreateRequest {
  paymentId: string;
  externalPayment: PlayfoodExternalPayment;
  merchant: PlayfoodVendorMerchant;
  amount: number;
}

export interface PlayfoodTransferCreateResponse {
  id: string;
  fee: object;
  total: number;
  net: number;
  details: object;
}

export interface PlayfoodWebhookRequest {
  externalPaymentId: string;
  webhookEventId: string;
  eventAction: PlayfoodEventAction;
  created: string;
  type: 'WEBHOOK';
  data: PlayfoodWebhookData;
}

export type PlayfoodEventAction = 
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_CAPTURED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_CANCELLED';

export interface PlayfoodWebhookData {
  paymentId: string;
  status: 'succeeded' | 'pending' | 'failed' | 'cancelled';
  amount: number;
  amountCaptured: number;
  amountRefunded: number;
  currency: string;
  error?: PlayfoodError;
  customer: PlayfoodCustomer;
  paymentMethodData?: PlayfoodPaymentMethodData;
  externalPayment: PlayfoodExternalPayment;
}

export interface PlayfoodWebhookResponse {
  status: 'received';
  message: 'Webhook processed successfully';
}

// Tipos para validação
export interface PlayfoodValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PlayfoodApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: PlayfoodValidationError[];
  };
  timestamp: string;
  correlationId: string;
}

export interface PlayfoodApiSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
  correlationId: string;
}

export type PlayfoodApiResponse<T> = PlayfoodApiSuccess<T> | PlayfoodApiError; 