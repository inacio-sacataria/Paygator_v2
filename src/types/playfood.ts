// Tipos baseados na documentação do PlayFood
export interface PlayfoodCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
}

export interface PlayfoodAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface PlayfoodOrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  notes?: string;
}

export interface PlayfoodOrder {
  id: string;
  reference_id: string;
  customer: PlayfoodCustomer;
  items: PlayfoodOrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  currency: 'BRL' | 'USD' | 'EUR';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  delivery_address: PlayfoodAddress;
  delivery_method: 'delivery' | 'pickup';
  estimated_delivery_time?: string | undefined;
  notes?: string | undefined;
  created_at: string;
  updated_at: string;
}

export interface PlayfoodPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: 'BRL' | 'USD' | 'EUR';
  payment_method: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'online';
  status: 'pending' | 'processing' | 'approved' | 'failed' | 'cancelled' | 'refunded';
  gateway: string;
  gateway_transaction_id?: string | undefined;
  installments?: number | undefined;
  card_brand?: string | undefined;
  card_last_four?: string | undefined;
  created_at: string;
  updated_at: string;
}

export interface PlayfoodWebhookPayload {
  id: string;
  event_type: PlayfoodEventType;
  timestamp: string;
  data: PlayfoodWebhookData;
  signature: string;
}

export type PlayfoodEventType = 
  | 'order.created'
  | 'order.confirmed'
  | 'order.preparing'
  | 'order.ready'
  | 'order.delivered'
  | 'order.cancelled'
  | 'payment.created'
  | 'payment.approved'
  | 'payment.failed'
  | 'payment.refunded';

export interface PlayfoodWebhookData {
  order?: PlayfoodOrder;
  payment?: PlayfoodPayment;
  previous_status?: string;
  new_status?: string;
}

export interface PlayfoodApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  correlation_id: string;
}

export interface PlayfoodPaginatedResponse<T> extends PlayfoodApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Tipos para endpoints específicos do PlayFood
export interface CreateOrderRequest {
  reference_id: string;
  customer: PlayfoodCustomer;
  items: PlayfoodOrderItem[];
  delivery_address: PlayfoodAddress;
  delivery_method: 'delivery' | 'pickup';
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: PlayfoodOrder['status'];
  payment_status?: PlayfoodOrder['payment_status'];
  estimated_delivery_time?: string;
  notes?: string;
}

export interface CreatePaymentRequest {
  order_id: string;
  amount: number;
  payment_method: PlayfoodPayment['payment_method'];
  gateway: string;
  installments?: number;
  card_brand?: string;
  card_last_four?: string;
}

export interface PlayfoodConfig {
  api_key: string;
  webhook_url?: string;
  webhook_secret?: string;
  environment: 'sandbox' | 'production';
  timeout_ms: number;
  retry_attempts: number;
} 