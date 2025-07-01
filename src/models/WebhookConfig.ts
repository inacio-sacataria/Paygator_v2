import mongoose, { Document, Schema } from 'mongoose';
import { EventType } from '../types/webhook';

export interface IWebhookConfig extends Document {
  name: string;
  url: string;
  events: EventType[];
  secret: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const WebhookConfigSchema = new Schema<IWebhookConfig>({
  name: {
    type: String,
    required: true,
    maxlength: 255
  },
  url: {
    type: String,
    required: true,
    maxlength: 500
  },
  events: [{
    type: String,
    enum: ['payment.created', 'payment.completed', 'payment.failed', 'payment.refunded'],
    required: true
  }],
  secret: {
    type: String,
    required: true,
    maxlength: 255
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  collection: 'webhook_configs'
});

export const WebhookConfig = mongoose.model<IWebhookConfig>('WebhookConfig', WebhookConfigSchema); 