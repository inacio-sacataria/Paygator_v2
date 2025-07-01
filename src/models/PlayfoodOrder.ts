import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayfoodOrder extends Document {
  reference_id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  currency: 'BRL' | 'USD' | 'EUR';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  delivery_address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  delivery_method: 'delivery' | 'pickup';
  estimated_delivery_time?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const PlayfoodOrderSchema = new Schema<IPlayfoodOrder>({
  reference_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 255
  },
  customer: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    document: String
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  delivery_fee: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['BRL', 'USD', 'EUR'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  delivery_address: {
    street: {
      type: String,
      required: true
    },
    number: {
      type: String,
      required: true
    },
    complement: String,
    neighborhood: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zip_code: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  delivery_method: {
    type: String,
    enum: ['delivery', 'pickup'],
    required: true
  },
  estimated_delivery_time: Date,
  notes: String
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  collection: 'playfood_orders'
});

export const PlayfoodOrder = mongoose.model<IPlayfoodOrder>('PlayfoodOrder', PlayfoodOrderSchema); 