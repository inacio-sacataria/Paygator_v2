export interface BillingAddress {
  countryCode: string;
  stateCode: string;
  city: string;
  postcode: string;
  street1: string;
  street2: string;
}

export interface CustomerExternal {
  id: string;
  data: any;
}

export interface Customer {
  email: string;
  phone: string;
  name: string;
  billingAddress: BillingAddress;
  external: CustomerExternal;
}

export interface VendorMerchant {
  id: string;
  externalId: string | null;
  businessType: 'INDIVIDUAL' | 'COMPANY';
  taxId: string;
  name: string;
  address: {
    addressLine: string;
    city: string;
    countryCode: string | null;
    zip: string;
  };
  phone: string;
  email: string;
  active: boolean;
  data: {
    companyData: any;
    merchantData: any;
  };
}

export interface OrderDetailsInternal {
  vendorMerchant: VendorMerchant;
  vendorShare: number;
}

export interface OrderDetailsPublic {
  vendorId: string;
  vendorName: string;
  cartTotal: number;
  deliveryTotal: number;
  taxTotal: number;
  serviceFeeTotal: number;
  discountTotal: number | null;
}

export interface OrderDetails {
  orderId: string;
  public: OrderDetailsPublic;
  internal: OrderDetailsInternal;
}

export interface CreatePaymentRequest {
  paymentId: string;
  externalPaymentId: number;
  paymentMethod: string | null;
  paymentMethodId: string | null;
  amount: number;
  currency: string;
  customer: Customer;
  locale: string;
  returnUrl: string;
  orderDetails: OrderDetails;
}

export interface ExternalPayment {
  id: string;
  data: any;
}

export interface CreatePaymentResponse {
  externalPayment: ExternalPayment;
  responseType: 'IFRAME' | 'REDIRECT' | 'API';
  link: string;
} 