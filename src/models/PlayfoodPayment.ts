import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayfoodPayment extends Document {
  order_id: string;
  amount: number;
  currency: 'BRL' | 'USD' | 'EUR';
  payment_method: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'online';
  status: 'pending' | 'processing' | 'approved' | 'failed' | 'cancelled' | 'refunded';
  gateway: string;
  gateway_transaction_id?: string;
  installments?: number;
  card_brand?: string;
  card_last_four?: string;
  created_at: Date;
  updated_at: Date;
}

const PlayfoodPaymentSchema = new Schema<IPlayfoodPayment>({
  order_id: {
    type: String,
    required: true,
    ref: 'PlayfoodOrder'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['BRL', 'USD', 'EUR'],
    required: true
  },
  payment_method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'pix', 'cash', 'online'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'approved', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  gateway: {
    type: String,
    required: true,
    maxlength: 100
  },
  gateway_transaction_id: {
    type: String,
    maxlength: 255
  },
  installments: {
    type: Number,
    min: 1
  },
  card_brand: {
    type: String,
    maxlength: 50
  },
  card_last_four: {
    type: String,
    maxlength: 4
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  collection: 'playfood_payments'
});

export const PlayfoodPayment = mongoose.model<IPlayfoodPayment>('PlayfoodPayment', PlayfoodPaymentSchema); 