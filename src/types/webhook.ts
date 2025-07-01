export interface Customer {
  id: string;
  email: string;
  name: string;
}

export interface PaymentData {
  payment_id: string;
  order_id: string;
  amount: number;
  currency: 'BRL' | 'USD' | 'EUR';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  provider: string;
  customer: Customer;
  metadata?: Record<string, any>;
}

export type EventType = 'payment.created' | 'payment.completed' | 'payment.failed' | 'payment.refunded';

export interface WebhookPayload {
  id: string;
  event_type: EventType;
  timestamp: string;
  data: PaymentData;
  signature: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  webhook_id?: string;
  processed_at?: string;
  errors?: string[];
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: EventType[];
  secret: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: EventType;
  payload: WebhookPayload;
  response_status: number;
  response_body: string;
  processing_time_ms: number;
  success: boolean;
  error_message?: string;
  retry_count: number;
  created_at: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  correlation_id: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
} 