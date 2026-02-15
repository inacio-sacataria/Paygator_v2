import { getDatabase } from '../config/sqlite';
import { logger } from '../utils/logger';

export interface Webhook {
  id?: number;
  url: string;
  secret?: string;
  provider: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookLog {
  id?: number;
  webhook_id?: number;
  provider: string;
  payload: string;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  processing_time?: number;
  created_at?: string;
}

export interface Payment {
  id?: number;
  payment_id: string;
  provider: string;
  amount: number;
  currency?: string;
  status: string;
  customer_id?: string;
  vendor_id?: string;
  metadata?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlayfoodOrder {
  id?: number;
  order_id: string;
  customer_id?: string;
  vendor_id?: string;
  total_amount: number;
  status: string;
  items?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vendor {
  id?: number;
  vendor_id: string;
  name: string;
  external_id?: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  address?: string;
  vendor_share?: number;
  data?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VendorPayout {
  id?: number;
  payment_id: string;
  vendor_id: string;
  total_amount: number;
  vendor_share_pct: number;
  system_commission_pct: number;
  system_commission_amount: number;
  vendor_amount: number;
  status: string;
  b2c_transaction_id?: string;
  paid_at?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export class SQLiteService {
  // Webhook operations
  async createWebhook(webhook: Webhook): Promise<number> {
    const db = getDatabase();
    const result = await db.run(
      'INSERT INTO webhooks (url, secret, provider, is_active) VALUES (?, ?, ?, ?)',
      [webhook.url, webhook.secret, webhook.provider, webhook.is_active ?? true]
    );
    return result.lastID!;
  }

  async getWebhooks(): Promise<Webhook[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM webhooks ORDER BY created_at DESC');
  }

  async getWebhookById(id: number): Promise<Webhook | null> {
    const db = getDatabase();
    const result = await db.get('SELECT * FROM webhooks WHERE id = ?', [id]);
    return result || null;
  }

  async updateWebhook(id: number, webhook: Partial<Webhook>): Promise<void> {
    const db = getDatabase();
    const fields = Object.keys(webhook).filter(key => key !== 'id');
    const values = Object.values(webhook);
    
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    await db.run(
      `UPDATE webhooks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteWebhook(id: number): Promise<void> {
    const db = getDatabase();
    await db.run('DELETE FROM webhooks WHERE id = ?', [id]);
  }

  // Webhook log operations
  async createWebhookLog(log: WebhookLog): Promise<number> {
    const db = getDatabase();
    const result = await db.run(
      'INSERT INTO webhook_logs (webhook_id, provider, payload, response_status, response_body, error_message, processing_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [log.webhook_id, log.provider, log.payload, log.response_status, log.response_body, log.error_message, log.processing_time]
    );
    return result.lastID!;
  }

  async getWebhookLogs(limit: number = 100, offset: number = 0): Promise<WebhookLog[]> {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  async getWebhookLogsByProvider(provider: string, limit: number = 100): Promise<WebhookLog[]> {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM webhook_logs WHERE provider = ? ORDER BY created_at DESC LIMIT ?',
      [provider, limit]
    );
  }

  // Payment operations
  async createPayment(payment: Payment): Promise<number> {
    const db = getDatabase();
    try {
      const query = 'INSERT INTO payments (payment_id, provider, amount, currency, status, customer_id, vendor_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const values = [payment.payment_id, payment.provider, payment.amount, payment.currency || 'MZN', payment.status, payment.customer_id, payment.vendor_id, payment.metadata];
      
      logger.info('Creating payment', {
        paymentId: payment.payment_id,
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        query,
        values
      });
      
      const result = await db.run(query, values);
      
      logger.info('Payment created successfully', {
        paymentId: payment.payment_id,
        lastID: result.lastID
      });
      
      return result.lastID!;
    } catch (error) {
      logger.error('Error creating payment', {
        paymentId: payment.payment_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        payment
      });
      throw error;
    }
  }

  async getPayments(limit: number = 100, offset: number = 0): Promise<Payment[]> {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM payments ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const db = getDatabase();
    try {
      const result = await db.get('SELECT * FROM payments WHERE payment_id = ?', [paymentId]);
      
      logger.info('Payment retrieved by ID', {
        paymentId,
        found: !!result,
        fields: result ? Object.keys(result) : []
      });
      
      return result || null;
    } catch (error) {
      logger.error('Error getting payment by ID', {
        paymentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async updatePayment(paymentId: string, payment: Partial<Payment>): Promise<void> {
    const db = getDatabase();
    const fields = Object.keys(payment).filter(key => key !== 'id' && key !== 'payment_id');
    const values = Object.values(payment);
    
    if (fields.length === 0) return;
    
    try {
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const query = `UPDATE payments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?`;
      
      logger.info('Updating payment', {
        paymentId,
        fields,
        query
      });
      
      await db.run(query, [...values, paymentId]);
      
      logger.info('Payment updated successfully', {
        paymentId,
        fieldsUpdated: fields
      });
    } catch (error) {
      logger.error('Error updating payment', {
        paymentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        fields,
        values
      });
      throw error;
    }
  }

  async getPaymentsByProvider(provider: string, limit: number = 100): Promise<Payment[]> {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM payments WHERE provider = ? ORDER BY created_at DESC LIMIT ?',
      [provider, limit]
    );
  }

  // Playfood order operations
  async createPlayfoodOrder(order: PlayfoodOrder): Promise<number> {
    const db = getDatabase();
    const result = await db.run(
      'INSERT INTO playfood_orders (order_id, customer_id, vendor_id, total_amount, status, items) VALUES (?, ?, ?, ?, ?, ?)',
      [order.order_id, order.customer_id, order.vendor_id, order.total_amount, order.status, order.items]
    );
    return result.lastID!;
  }

  async getPlayfoodOrders(limit: number = 100, offset: number = 0): Promise<PlayfoodOrder[]> {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM playfood_orders ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  async getPlayfoodOrderById(orderId: string): Promise<PlayfoodOrder | null> {
    const db = getDatabase();
    const result = await db.get('SELECT * FROM playfood_orders WHERE order_id = ?', [orderId]);
    return result || null;
  }

  async updatePlayfoodOrder(orderId: string, order: Partial<PlayfoodOrder>): Promise<void> {
    const db = getDatabase();
    const fields = Object.keys(order).filter(key => key !== 'id' && key !== 'order_id');
    const values = Object.values(order);
    
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    await db.run(
      `UPDATE playfood_orders SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`,
      [...values, orderId]
    );
  }

  // Admin session operations
  async createAdminSession(sessionId: string, userId: string, expiresAt: Date): Promise<void> {
    const db = getDatabase();
    await db.run(
      'INSERT INTO admin_sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)',
      [sessionId, userId, expiresAt.toISOString()]
    );
  }

  async getAdminSession(sessionId: string): Promise<{ session_id: string; user_id: string; expires_at: string } | null> {
    const db = getDatabase();
    const result = await db.get(
      'SELECT * FROM admin_sessions WHERE session_id = ? AND expires_at > datetime("now")',
      [sessionId]
    );
    return result || null;
  }

  async deleteAdminSession(sessionId: string): Promise<void> {
    const db = getDatabase();
    await db.run('DELETE FROM admin_sessions WHERE session_id = ?', [sessionId]);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const db = getDatabase();
    await db.run('DELETE FROM admin_sessions WHERE expires_at <= datetime("now")');
  }

  // Statistics
  async getStatistics(): Promise<{
    totalPayments: number;
    totalOrders: number;
    totalWebhooks: number;
    totalLogs: number;
    recentPayments: Payment[];
    recentOrders: PlayfoodOrder[];
  }> {
    const db = getDatabase();
    
    const totalPaymentsResult = await db.get('SELECT COUNT(*) as count FROM payments');
    const totalOrdersResult = await db.get('SELECT COUNT(*) as count FROM playfood_orders');
    const totalWebhooksResult = await db.get('SELECT COUNT(*) as count FROM webhooks');
    const totalLogsResult = await db.get('SELECT COUNT(*) as count FROM webhook_logs');
    
    const recentPayments = await db.all('SELECT * FROM payments ORDER BY created_at DESC LIMIT 10');
    const recentOrders = await db.all('SELECT * FROM playfood_orders ORDER BY created_at DESC LIMIT 10');
    
    return {
      totalPayments: totalPaymentsResult?.count || 0,
      totalOrders: totalOrdersResult?.count || 0,
      totalWebhooks: totalWebhooksResult?.count || 0,
      totalLogs: totalLogsResult?.count || 0,
      recentPayments,
      recentOrders
    };
  }

  // Vendor operations
  async upsertVendor(vendor: Vendor): Promise<number> {
    const db = getDatabase();
    const existing = await db.get('SELECT id FROM vendors WHERE vendor_id = ?', [vendor.vendor_id]);
    const addressStr = typeof vendor.address === 'string' ? vendor.address : (vendor.address ? JSON.stringify(vendor.address) : null);
    const dataStr = typeof vendor.data === 'string' ? vendor.data : (vendor.data ? JSON.stringify(vendor.data) : null);
    if (existing) {
      await db.run(
        `UPDATE vendors SET name = ?, external_id = ?, tax_id = ?, phone = ?, email = ?, address = ?, vendor_share = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE vendor_id = ?`,
        [vendor.name, vendor.external_id || null, vendor.tax_id || null, vendor.phone || null, vendor.email || null, addressStr, vendor.vendor_share ?? 85, dataStr, vendor.vendor_id]
      );
      return existing.id as number;
    }
    const result = await db.run(
      `INSERT INTO vendors (vendor_id, name, external_id, tax_id, phone, email, address, vendor_share, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vendor.vendor_id, vendor.name, vendor.external_id || null, vendor.tax_id || null, vendor.phone || null, vendor.email || null, addressStr, vendor.vendor_share ?? 85, dataStr]
    );
    return result.lastID!;
  }

  async getVendors(limit: number = 100, offset: number = 0): Promise<Vendor[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM vendors ORDER BY name ASC LIMIT ? OFFSET ?', [limit, offset]);
  }

  async getVendorById(vendorId: string): Promise<Vendor | null> {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM vendors WHERE vendor_id = ?', [vendorId]);
    return row || null;
  }

  async getPaymentsByVendorId(vendorId: string, limit: number = 100): Promise<Payment[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM payments WHERE vendor_id = ? ORDER BY created_at DESC LIMIT ?', [vendorId, limit]);
  }

  // Vendor payout (comissões) operations
  async createVendorPayout(payout: VendorPayout): Promise<number> {
    const db = getDatabase();
    const result = await db.run(
      `INSERT INTO vendor_payouts (payment_id, vendor_id, total_amount, vendor_share_pct, system_commission_pct, system_commission_amount, vendor_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [payout.payment_id, payout.vendor_id, payout.total_amount, payout.vendor_share_pct, payout.system_commission_pct, payout.system_commission_amount, payout.vendor_amount, payout.status || 'pending']
    );
    return result.lastID!;
  }

  async updateVendorPayout(id: number, update: Partial<VendorPayout>): Promise<void> {
    const db = getDatabase();
    const fields = Object.keys(update).filter(k => !['id', 'created_at'].includes(k));
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (update as any)[f]);
    await db.run(`UPDATE vendor_payouts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
  }

  async getVendorPayoutsByPaymentId(paymentId: string): Promise<VendorPayout[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM vendor_payouts WHERE payment_id = ?', [paymentId]);
  }

  async getAllVendorPayouts(limit: number = 200): Promise<VendorPayout[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM vendor_payouts ORDER BY created_at DESC LIMIT ?', [limit]);
  }

  /** Pagamentos com status completed/approved que ainda não têm vendorB2CPayment.status === 'completed' */
  async getCompletedPaymentsNotPaidToVendor(): Promise<Payment[]> {
    const db = getDatabase();
    const rows = await db.all(
      "SELECT * FROM payments WHERE status IN ('completed', 'approved') ORDER BY created_at ASC"
    );
    const filtered: Payment[] = [];
    for (const p of rows) {
      try {
        const meta = p.metadata ? JSON.parse(p.metadata) : {};
        if (meta.vendorB2CPayment && meta.vendorB2CPayment.status === 'completed') continue;
        filtered.push(p as Payment);
      } catch {
        filtered.push(p as Payment);
      }
    }
    return filtered;
  }
}

export const sqliteService = new SQLiteService(); 