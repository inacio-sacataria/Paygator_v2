/**
 * Data service using PostgreSQL (Supabase). Same interface as sqliteService.
 * Used when DATABASE_URL is set.
 */
import { sql } from '../config/db';
import { logger } from '../utils/logger';
import type {
  Webhook,
  WebhookLog,
  Payment,
  PlayfoodOrder,
  Vendor,
  VendorPayout,
} from './sqliteService';

function getSql() {
  if (!sql) throw new Error('PostgreSQL not configured (DATABASE_URL missing)');
  return sql;
}

/** Run init-supabase-data.sql statements to create tables if not exist */
export async function initSupabaseDataTables(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const sqlPath = path.join(process.cwd(), 'scripts', 'init-supabase-data.sql');
  if (!fs.existsSync(sqlPath)) {
    logger.warn('init-supabase-data.sql not found, skipping table creation');
    return;
  }
  const fullSql = fs.readFileSync(sqlPath, 'utf8');
  const statements = fullSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
  const s = getSql();
  for (const stmt of statements) {
    try {
      await s.unsafe(stmt + ';');
    } catch (err) {
      if (String(err).includes('already exists')) continue;
      logger.warn('Init SQL statement failed', { err: err instanceof Error ? err.message : err, stmt: stmt.substring(0, 80) });
    }
  }
  logger.info('Supabase data tables initialized');
}

class PostgresDataService {
  async createWebhook(webhook: Webhook): Promise<number> {
    const s = getSql();
    const [row] = await s`
      INSERT INTO webhooks (url, secret, provider, is_active)
      VALUES (${webhook.url}, ${webhook.secret ?? null}, ${webhook.provider}, ${webhook.is_active ?? true})
      RETURNING id
    `;
    return (row as { id: number })['id'];
  }

  async getWebhooks(): Promise<Webhook[]> {
    const s = getSql();
    return (await s`SELECT * FROM webhooks ORDER BY created_at DESC`) as unknown as Webhook[];
  }

  async getWebhookById(id: number): Promise<Webhook | null> {
    const s = getSql();
    const [row] = await s`SELECT * FROM webhooks WHERE id = ${id}`;
    return (row as Webhook) || null;
  }

  async updateWebhook(id: number, webhook: Partial<Webhook>): Promise<void> {
    const s = getSql();
    const allowed = ['url', 'secret', 'provider', 'is_active'] as const;
    const parts: string[] = [];
    const values: unknown[] = [];
    let i = 0;
    for (const f of allowed) {
      if ((webhook as Record<string, unknown>)[f] === undefined) continue;
      i++;
      parts.push(`${f} = $${i}`);
      values.push((webhook as Record<string, unknown>)[f]);
    }
    if (parts.length === 0) return;
    values.push(id);
    await s.unsafe(`UPDATE webhooks SET ${parts.join(', ')}, updated_at = NOW() WHERE id = $${i + 1}`, values as (string | number | boolean | null)[]);
  }

  async deleteWebhook(id: number): Promise<void> {
    const s = getSql();
    await s`DELETE FROM webhooks WHERE id = ${id}`;
  }

  async createWebhookLog(log: WebhookLog): Promise<number> {
    const s = getSql();
    const [row] = await s`
      INSERT INTO webhook_logs (webhook_id, provider, payload, response_status, response_body, error_message, processing_time)
      VALUES (${log.webhook_id ?? null}, ${log.provider}, ${log.payload}, ${log.response_status ?? null}, ${log.response_body ?? null}, ${log.error_message ?? null}, ${log.processing_time ?? null})
      RETURNING id
    `;
    return (row as { id: number })['id'];
  }

  async getWebhookLogs(limit = 100, offset = 0): Promise<WebhookLog[]> {
    const s = getSql();
    return (await s`SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`) as unknown as WebhookLog[];
  }

  async getWebhookLogsByProvider(provider: string, limit = 100): Promise<WebhookLog[]> {
    const s = getSql();
    return (await s`SELECT * FROM webhook_logs WHERE provider = ${provider} ORDER BY created_at DESC LIMIT ${limit}`) as unknown as WebhookLog[];
  }

  async createPayment(payment: Payment): Promise<number> {
    const s = getSql();
    const [row] = await s`
      INSERT INTO payments (payment_id, provider, amount, currency, status, customer_id, vendor_id, metadata)
      VALUES (${payment.payment_id}, ${payment.provider}, ${payment.amount}, ${payment.currency ?? 'MZN'}, ${payment.status}, ${payment.customer_id ?? null}, ${payment.vendor_id ?? null}, ${payment.metadata ?? null})
      RETURNING id
    `;
    return (row as { id: number })['id'];
  }

  async getPayments(limit = 100, offset = 0): Promise<Payment[]> {
    const s = getSql();
    return (await s`SELECT * FROM payments ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`) as unknown as Payment[];
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const s = getSql();
    const [row] = await s`SELECT * FROM payments WHERE payment_id = ${paymentId}`;
    return (row as Payment) || null;
  }

  async updatePayment(paymentId: string, payment: Partial<Payment>): Promise<void> {
    const s = getSql();
    const fields = Object.keys(payment).filter((k) => k !== 'id' && k !== 'payment_id');
    if (fields.length === 0) return;
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 0;
    for (const f of fields) {
      i++;
      updates.push(`${f} = $${i}`);
      values.push((payment as Record<string, unknown>)[f]);
    }
    values.push(paymentId);
    await s.unsafe(`UPDATE payments SET ${updates.join(', ')}, updated_at = NOW() WHERE payment_id = $${i + 1}`, values as (string | number | null)[]);
  }

  async getPaymentsByProvider(provider: string, limit = 100): Promise<Payment[]> {
    const s = getSql();
    return (await s`SELECT * FROM payments WHERE provider = ${provider} ORDER BY created_at DESC LIMIT ${limit}`) as unknown as Payment[];
  }

  async createPlayfoodOrder(order: PlayfoodOrder): Promise<number> {
    const s = getSql();
    const [row] = await s`
      INSERT INTO playfood_orders (order_id, customer_id, vendor_id, total_amount, status, items)
      VALUES (${order.order_id}, ${order.customer_id ?? null}, ${order.vendor_id ?? null}, ${order.total_amount}, ${order.status}, ${order.items ?? null})
      RETURNING id
    `;
    return (row as { id: number })['id'];
  }

  async getPlayfoodOrders(limit = 100, offset = 0): Promise<PlayfoodOrder[]> {
    const s = getSql();
    return (await s`SELECT * FROM playfood_orders ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`) as unknown as PlayfoodOrder[];
  }

  async getPlayfoodOrderById(orderId: string): Promise<PlayfoodOrder | null> {
    const s = getSql();
    const [row] = await s`SELECT * FROM playfood_orders WHERE order_id = ${orderId}`;
    return (row as PlayfoodOrder) || null;
  }

  async updatePlayfoodOrder(orderId: string, order: Partial<PlayfoodOrder>): Promise<void> {
    const s = getSql();
    const fields = Object.keys(order).filter((k) => k !== 'id' && k !== 'order_id');
    if (fields.length === 0) return;
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 0;
    for (const f of fields) {
      i++;
      updates.push(`${f} = $${i}`);
      values.push((order as Record<string, unknown>)[f]);
    }
    values.push(orderId);
    await s.unsafe(`UPDATE playfood_orders SET ${updates.join(', ')}, updated_at = NOW() WHERE order_id = $${i + 1}`, values as (string | number | null)[]);
  }

  async createAdminSession(sessionId: string, userId: string, expiresAt: Date): Promise<void> {
    const s = getSql();
    await s`INSERT INTO admin_sessions (session_id, user_id, expires_at) VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})`;
  }

  async getAdminSession(sessionId: string): Promise<{ session_id: string; user_id: string; expires_at: string } | null> {
    const s = getSql();
    const [row] = await s`SELECT session_id, user_id, expires_at FROM admin_sessions WHERE session_id = ${sessionId} AND expires_at > NOW()`;
    return (row as { session_id: string; user_id: string; expires_at: string }) || null;
  }

  async deleteAdminSession(sessionId: string): Promise<void> {
    const s = getSql();
    await s`DELETE FROM admin_sessions WHERE session_id = ${sessionId}`;
  }

  async cleanupExpiredSessions(): Promise<void> {
    const s = getSql();
    await s`DELETE FROM admin_sessions WHERE expires_at <= NOW()`;
  }

  async getStatistics(): Promise<{
    totalPayments: number;
    totalOrders: number;
    totalWebhooks: number;
    totalLogs: number;
    recentPayments: Payment[];
    recentOrders: PlayfoodOrder[];
  }> {
    const s = getSql();
    const [tp] = await s`SELECT COUNT(*)::int as count FROM payments`;
    const [to] = await s`SELECT COUNT(*)::int as count FROM playfood_orders`;
    const [tw] = await s`SELECT COUNT(*)::int as count FROM webhooks`;
    const [tl] = await s`SELECT COUNT(*)::int as count FROM webhook_logs`;
    const recentPayments = (await s`SELECT * FROM payments ORDER BY created_at DESC LIMIT 10`) as unknown as Payment[];
    const recentOrders = (await s`SELECT * FROM playfood_orders ORDER BY created_at DESC LIMIT 10`) as unknown as PlayfoodOrder[];
    return {
      totalPayments: (tp as { count: number })['count'] ?? 0,
      totalOrders: (to as { count: number })['count'] ?? 0,
      totalWebhooks: (tw as { count: number })['count'] ?? 0,
      totalLogs: (tl as { count: number })['count'] ?? 0,
      recentPayments,
      recentOrders,
    };
  }

  async upsertVendor(vendor: Vendor): Promise<number> {
    const s = getSql();
    const addressStr = typeof vendor.address === 'string' ? vendor.address : vendor.address ? JSON.stringify(vendor.address) : null;
    const dataStr = typeof vendor.data === 'string' ? vendor.data : vendor.data ? JSON.stringify(vendor.data) : null;
    const [existing] = await s`SELECT id FROM vendors WHERE vendor_id = ${vendor.vendor_id}`;
    if (existing) {
      const id = (existing as { id: number })['id'];
      await s`
        UPDATE vendors SET name = ${vendor.name}, external_id = ${vendor.external_id ?? null}, tax_id = ${vendor.tax_id ?? null}, phone = ${vendor.phone ?? null}, email = ${vendor.email ?? null}, address = ${addressStr}, vendor_share = ${vendor.vendor_share ?? 85}, data = ${dataStr}, updated_at = NOW()
        WHERE vendor_id = ${vendor.vendor_id}
      `;
      return id;
    }
    const [row] = await s`
      INSERT INTO vendors (vendor_id, name, external_id, tax_id, phone, email, address, vendor_share, data)
      VALUES (${vendor.vendor_id}, ${vendor.name}, ${vendor.external_id ?? null}, ${vendor.tax_id ?? null}, ${vendor.phone ?? null}, ${vendor.email ?? null}, ${addressStr}, ${vendor.vendor_share ?? 85}, ${dataStr})
      RETURNING id
    `;
    return (row as { id: number })['id'];
  }

  async getVendors(limit = 100, offset = 0): Promise<Vendor[]> {
    const s = getSql();
    return (await s`SELECT * FROM vendors ORDER BY name ASC LIMIT ${limit} OFFSET ${offset}`) as unknown as Vendor[];
  }

  async getVendorById(vendorId: string): Promise<Vendor | null> {
    const s = getSql();
    const [row] = await s`SELECT * FROM vendors WHERE vendor_id = ${vendorId}`;
    return (row as Vendor) || null;
  }

  async getPaymentsByVendorId(vendorId: string, limit = 100): Promise<Payment[]> {
    const s = getSql();
    return (await s`SELECT * FROM payments WHERE vendor_id = ${vendorId} ORDER BY created_at DESC LIMIT ${limit}`) as unknown as Payment[];
  }

  async createVendorPayout(payout: VendorPayout): Promise<number> {
    const s = getSql();
    const [row] = await s`
      INSERT INTO vendor_payouts (payment_id, vendor_id, total_amount, vendor_share_pct, system_commission_pct, system_commission_amount, vendor_amount, status)
      VALUES (${payout.payment_id}, ${payout.vendor_id}, ${payout.total_amount}, ${payout.vendor_share_pct}, ${payout.system_commission_pct}, ${payout.system_commission_amount}, ${payout.vendor_amount}, ${payout.status || 'pending'})
      RETURNING id
    `;
    return (row as { id: number })['id'];
  }

  async updateVendorPayout(id: number, update: Partial<VendorPayout>): Promise<void> {
    const s = getSql();
    const fields = Object.keys(update).filter((k) => !['id', 'created_at'].includes(k));
    if (fields.length === 0) return;
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 0;
    for (const f of fields) {
      i++;
      updates.push(`${f} = $${i}`);
      values.push((update as Record<string, unknown>)[f]);
    }
    values.push(id);
    await s.unsafe(`UPDATE vendor_payouts SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i + 1}`, values as (string | number | null)[]);
  }

  async getVendorPayoutsByPaymentId(paymentId: string): Promise<VendorPayout[]> {
    const s = getSql();
    return (await s`SELECT * FROM vendor_payouts WHERE payment_id = ${paymentId}`) as unknown as VendorPayout[];
  }

  async getAllVendorPayouts(limit = 200): Promise<VendorPayout[]> {
    const s = getSql();
    return (await s`SELECT * FROM vendor_payouts ORDER BY created_at DESC LIMIT ${limit}`) as unknown as VendorPayout[];
  }

  async getCompletedPaymentsNotPaidToVendor(): Promise<Payment[]> {
    const s = getSql();
    const rows = (await s`SELECT * FROM payments WHERE status IN ('completed', 'approved') ORDER BY created_at ASC`) as unknown as Payment[];
    const filtered: Payment[] = [];
    for (const p of rows) {
      try {
        const meta = (p as Payment).metadata ? JSON.parse((p as Payment).metadata!) : {};
        if (meta['vendorB2CPayment'] && meta['vendorB2CPayment']['status'] === 'completed') continue;
        filtered.push(p);
      } catch {
        filtered.push(p);
      }
    }
    return filtered;
  }
}

export const postgresDataService = new PostgresDataService();
