import { 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  CreatePaymentRequest,
  PlayfoodApiResponse,
  PlayfoodPaginatedResponse,
  PlayfoodOrder,
  PlayfoodPayment
} from '../types/playfood';
import { PlayfoodOrder as PlayfoodOrderModel } from '../models/PlayfoodOrder';
import { PlayfoodPayment as PlayfoodPaymentModel } from '../models/PlayfoodPayment';
import { logger } from '../utils/logger';

export class PlayfoodService {
  public async createOrder(orderData: CreateOrderRequest): Promise<any> {
    // Calcular valores
    const subtotal = orderData.items.reduce((sum, item) => sum + item.total_price, 0);
    const delivery_fee = orderData.delivery_method === 'delivery' ? 5.0 : 0;
    const discount = 0;
    const total = subtotal + delivery_fee - discount;

    const order = new PlayfoodOrderModel({
      reference_id: orderData.reference_id,
      customer: orderData.customer,
      subtotal: subtotal,
      delivery_fee: delivery_fee,
      discount: discount,
      total: total,
      currency: 'BRL',
      status: 'pending',
      payment_status: 'pending',
      delivery_address: orderData.delivery_address,
      delivery_method: orderData.delivery_method,
      notes: orderData.notes
    });

    const saved = await order.save();
    
    const result = {
      id: (saved._id as any).toString(),
      reference_id: saved.reference_id,
      customer: saved.customer,
      items: [], // TODO: Implementar items
      subtotal: saved.subtotal,
      delivery_fee: saved.delivery_fee,
      discount: saved.discount,
      total: saved.total,
      currency: saved.currency,
      status: saved.status,
      payment_status: saved.payment_status,
      delivery_address: saved.delivery_address,
      delivery_method: saved.delivery_method,
      notes: saved.notes ?? undefined,
      created_at: saved.created_at.toISOString(),
      updated_at: saved.updated_at.toISOString()
    } as PlayfoodOrder;

    if (saved.estimated_delivery_time) {
      result.estimated_delivery_time = saved.estimated_delivery_time.toISOString();
    }

    return result;
  }

  public async getOrder(id: string): Promise<PlayfoodOrder> {
    const order = await PlayfoodOrderModel.findById(id);
    
    if (!order) {
      throw new Error('Order not found');
    }

    return {
      id: (order._id as any).toString(),
      reference_id: order.reference_id,
      customer: order.customer,
      items: [], // TODO: Implementar items
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      discount: order.discount,
      total: order.total,
      currency: order.currency,
      status: order.status,
      payment_status: order.payment_status,
      delivery_address: order.delivery_address,
      delivery_method: order.delivery_method,
      estimated_delivery_time: order.estimated_delivery_time ? order.estimated_delivery_time.toISOString() : undefined,
      notes: order.notes ?? undefined,
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString()
    } as PlayfoodOrder;
  }

  public async listOrders(
    page: number = 1,
    limit: number = 10,
    status?: string,
    customer_id?: string
  ): Promise<PlayfoodPaginatedResponse<PlayfoodOrder>> {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (status) where.status = status;
    if (customer_id) where['customer.id'] = customer_id;

    const [orders, total] = await Promise.all([
      PlayfoodOrderModel.find(where)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PlayfoodOrderModel.countDocuments(where)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: orders.map((order: any) => ({
        id: order._id.toString(),
        reference_id: order.reference_id,
        customer: order.customer,
        items: [], // TODO: Implementar items
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        discount: order.discount,
        total: order.total,
        currency: order.currency,
        status: order.status,
        payment_status: order.payment_status,
        delivery_address: order.delivery_address,
        delivery_method: order.delivery_method,
        estimated_delivery_time: order.estimated_delivery_time ? order.estimated_delivery_time.toISOString() : undefined,
        notes: order.notes ?? undefined,
        created_at: order.created_at.toISOString(),
        updated_at: order.updated_at.toISOString()
      } as PlayfoodOrder)),
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages
      },
      timestamp: new Date().toISOString(),
      correlation_id: 'service'
    };
  }

  public async updateOrder(id: string, updateData: UpdateOrderRequest): Promise<PlayfoodOrder> {
    const order = await PlayfoodOrderModel.findById(id);
    
    if (!order) {
      throw new Error('Order not found');
    }

    Object.assign(order, updateData);
    const saved = await order.save();

    return {
      id: (saved._id as any).toString(),
      reference_id: saved.reference_id,
      customer: saved.customer,
      items: [], // TODO: Implementar items
      subtotal: saved.subtotal,
      delivery_fee: saved.delivery_fee,
      discount: saved.discount,
      total: saved.total,
      currency: saved.currency,
      status: saved.status,
      payment_status: saved.payment_status,
      delivery_address: saved.delivery_address,
      delivery_method: saved.delivery_method,
      estimated_delivery_time: saved.estimated_delivery_time ? saved.estimated_delivery_time.toISOString() : undefined,
      notes: saved.notes ?? undefined,
      created_at: saved.created_at.toISOString(),
      updated_at: saved.updated_at.toISOString()
    };
  }

  public async cancelOrder(id: string, reason: string): Promise<PlayfoodOrder> {
    const order = await PlayfoodOrderModel.findById(id);
    
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = 'cancelled';
    order.notes = reason;
    const saved = await order.save();

    return {
      id: (saved._id as any).toString(),
      reference_id: saved.reference_id,
      customer: saved.customer,
      items: [], // TODO: Implementar items
      subtotal: saved.subtotal,
      delivery_fee: saved.delivery_fee,
      discount: saved.discount,
      total: saved.total,
      currency: saved.currency,
      status: saved.status,
      payment_status: saved.payment_status,
      delivery_address: saved.delivery_address,
      delivery_method: saved.delivery_method,
      estimated_delivery_time: saved.estimated_delivery_time ? saved.estimated_delivery_time.toISOString() : undefined,
      notes: saved.notes ?? undefined,
      created_at: saved.created_at.toISOString(),
      updated_at: saved.updated_at.toISOString()
    };
  }

  public async createPayment(paymentData: CreatePaymentRequest): Promise<PlayfoodPayment> {
    const payment = new PlayfoodPaymentModel({
      order_id: paymentData.order_id,
      amount: paymentData.amount,
      currency: 'BRL',
      payment_method: paymentData.payment_method,
      status: 'pending',
      gateway: paymentData.gateway,
      installments: paymentData.installments,
      card_brand: paymentData.card_brand,
      card_last_four: paymentData.card_last_four
    });

    const saved = await payment.save();
    
    return {
      id: (saved._id as any).toString(),
      order_id: saved.order_id,
      amount: saved.amount,
      currency: saved.currency,
      payment_method: saved.payment_method,
      status: saved.status,
      gateway: saved.gateway,
      gateway_transaction_id: saved.gateway_transaction_id ?? undefined,
      installments: saved.installments ?? undefined,
      card_brand: saved.card_brand ?? undefined,
      card_last_four: saved.card_last_four ?? undefined,
      created_at: saved.created_at.toISOString(),
      updated_at: saved.updated_at.toISOString()
    };
  }

  public async getPayment(id: string): Promise<PlayfoodPayment> {
    const payment = await PlayfoodPaymentModel.findById(id);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      id: (payment._id as any).toString(),
      order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      status: payment.status,
      gateway: payment.gateway,
      gateway_transaction_id: payment.gateway_transaction_id ?? undefined,
      installments: payment.installments ?? undefined,
      card_brand: payment.card_brand ?? undefined,
      card_last_four: payment.card_last_four ?? undefined,
      created_at: payment.created_at.toISOString(),
      updated_at: payment.updated_at.toISOString()
    };
  }

  public async listPayments(
    page: number = 1,
    limit: number = 10,
    status?: string,
    order_id?: string
  ): Promise<PlayfoodPaginatedResponse<PlayfoodPayment>> {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (status) where.status = status;
    if (order_id) where.order_id = order_id;

    const [payments, total] = await Promise.all([
      PlayfoodPaymentModel.find(where)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PlayfoodPaymentModel.countDocuments(where)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: payments.map((payment: any) => ({
        id: payment._id.toString(),
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.payment_method,
        status: payment.status,
        gateway: payment.gateway,
        gateway_transaction_id: payment.gateway_transaction_id ?? undefined,
        installments: payment.installments ?? undefined,
        card_brand: payment.card_brand ?? undefined,
        card_last_four: payment.card_last_four ?? undefined,
        created_at: payment.created_at.toISOString(),
        updated_at: payment.updated_at.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages
      },
      timestamp: new Date().toISOString(),
      correlation_id: 'service'
    };
  }

  public async refundPayment(id: string, amount?: number, reason?: string): Promise<PlayfoodPayment> {
    const payment = await PlayfoodPaymentModel.findById(id);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = 'refunded';
    const saved = await payment.save();

    return {
      id: (saved._id as any).toString(),
      order_id: saved.order_id,
      amount: saved.amount,
      currency: saved.currency,
      payment_method: saved.payment_method,
      status: saved.status,
      gateway: saved.gateway,
      gateway_transaction_id: saved.gateway_transaction_id ?? undefined,
      installments: saved.installments ?? undefined,
      card_brand: saved.card_brand ?? undefined,
      card_last_four: saved.card_last_four ?? undefined,
      created_at: saved.created_at.toISOString(),
      updated_at: saved.updated_at.toISOString()
    };
  }

  public async getStatus(): Promise<any> {
    const [totalOrders, pendingOrders, completedOrders, cancelledOrders, totalPayments, pendingPayments, completedPayments, failedPayments] = await Promise.all([
      PlayfoodOrderModel.countDocuments(),
      PlayfoodOrderModel.countDocuments({ status: 'pending' }),
      PlayfoodOrderModel.countDocuments({ status: 'delivered' }),
      PlayfoodOrderModel.countDocuments({ status: 'cancelled' }),
      PlayfoodPaymentModel.countDocuments(),
      PlayfoodPaymentModel.countDocuments({ status: 'pending' }),
      PlayfoodPaymentModel.countDocuments({ status: 'approved' }),
      PlayfoodPaymentModel.countDocuments({ status: 'failed' })
    ]);

    return {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders
      },
      payments: {
        total: totalPayments,
        pending: pendingPayments,
        completed: completedPayments,
        failed: failedPayments
      }
    };
  }
} 