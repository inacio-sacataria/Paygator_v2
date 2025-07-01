import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayfoodOrderItem extends Document {
  order_id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  notes?: string;
}

const PlayfoodOrderItemSchema = new Schema<IPlayfoodOrderItem>({
  order_id: {
    type: String,
    required: true,
    ref: 'PlayfoodOrder'
  },
  name: {
    type: String,
    required: true,
    maxlength: 255
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    maxlength: 100
  },
  notes: String
}, {
  timestamps: false,
  collection: 'playfood_order_items'
});

export const PlayfoodOrderItem = mongoose.model<IPlayfoodOrderItem>('PlayfoodOrderItem', PlayfoodOrderItemSchema); 