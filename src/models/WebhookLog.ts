import mongoose, { Document, Schema } from 'mongoose';
import { EventType, WebhookPayload } from '../types/webhook';

export interface IWebhookLog extends Document {
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

const WebhookLogSchema = new Schema<IWebhookLog>({
  webhook_id: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    enum: ['payment.created', 'payment.completed', 'payment.failed', 'payment.refunded'],
    required: true
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true
  },
  response_status: {
    type: Number,
    required: true
  },
  response_body: {
    type: String,
    required: true
  },
  processing_time_ms: {
    type: Number,
    required: true
  },
  success: {
    type: Boolean,
    required: true
  },
  error_message: {
    type: String
  },
  retry_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: false 
  },
  collection: 'webhook_logs'
});

export const WebhookLog = mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema); 