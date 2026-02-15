import { createClient } from '@supabase/supabase-js';
import { config } from './environment';
import { logger } from '../utils/logger';
import { sql, isDbConfigured, testConnection } from './db';

export const supabase = createClient(
  config.database.supabase.url,
  config.database.supabase.anonKey
);

/** @deprecated Use sql from ./db (postgres.js). Mantido só para compatibilidade de tipo. */
export const pgClient = null as unknown as { query: (q: string, v?: any[]) => Promise<{ rows: any[] }>; connect: () => Promise<void> };

export class SupabaseService {
  private client = supabase;

  async testConnection(): Promise<boolean> {
    return testConnection();
  }

  async getServiceStatus(): Promise<{ status: string; message: string; data?: any }> {
    try {
      const isConnected = await this.testConnection();
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        message: isConnected
          ? 'Supabase database is connected and operational'
          : 'Supabase database connection failed',
        data: {
          provider: 'supabase',
          url: config.database.supabase.url,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error getting Supabase service status', { error });
      return {
        status: 'error',
        message: 'Error checking Supabase service status',
        data: {
          provider: 'supabase',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async createPayment(paymentData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!sql || !isDbConfigured()) {
      return { success: false, error: 'Database not configured' };
    }
    try {
      const [row] = await sql`
        INSERT INTO payments (
          payment_id, external_payment_id, amount, currency, payment_method,
          customer_email, customer_name, customer_phone, status, order_id,
          return_url, iframe_link, created_at, updated_at
        ) VALUES (
          ${paymentData.payment_id},
          ${paymentData.external_payment_id},
          ${paymentData.amount},
          ${paymentData.currency},
          ${paymentData.payment_method},
          ${paymentData.customer_email},
          ${paymentData.customer_name},
          ${paymentData.customer_phone},
          ${paymentData.status},
          ${paymentData.order_id},
          ${paymentData.return_url},
          ${paymentData.iframe_link},
          ${paymentData.created_at},
          ${paymentData.updated_at}
        )
        RETURNING *
      `;
      if (row) {
        logger.info('Payment created successfully in Supabase', { paymentId: row['payment_id'] });
        return { success: true, data: row };
      }
      return { success: false, error: 'No row returned' };
    } catch (error) {
      logger.error('Error creating payment in Supabase', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getPayment(paymentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!sql || !isDbConfigured()) {
      return { success: false, error: 'Database not configured' };
    }
    try {
      const rows = await sql`SELECT * FROM payments WHERE payment_id = ${paymentId}`;
      if (rows.length === 0) {
        logger.warn('Payment not found in database', { paymentId });
        return { success: false, error: 'Payment not found' };
      }
      return { success: true, data: rows[0] };
    } catch (error) {
      logger.error('Error getting payment from Supabase', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updatePayment(paymentId: string, updateData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.client
        .from('payments')
        .update(updateData)
        .eq('payment_id', paymentId)
        .select();
      if (error) {
        logger.error('Error updating payment in Supabase', { error: error.message });
        return { success: false, error: error.message };
      }
      logger.info('Payment updated successfully in Supabase', { paymentId });
      return { success: true, data: data?.[0] };
    } catch (error) {
      logger.error('Error updating payment in Supabase', { error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getPaymentsCount(): Promise<{ success: boolean; count?: number; error?: string }> {
    if (!sql || !isDbConfigured()) {
      return { success: false, error: 'Database not configured' };
    }
    try {
      const rows = await sql`SELECT COUNT(*)::int as count FROM payments`;
      const count = Number(rows[0]?.['count'] ?? 0);
      return { success: true, count };
    } catch (error) {
      logger.error('Error getting payments count from Supabase', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getRecentPayments(limit: number = 10): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        logger.error('Error getting recent payments from Supabase', { error: error.message });
        return { success: false, error: error.message };
      }
      return { success: true, data: data || [] };
    } catch (error) {
      logger.error('Error getting recent payments from Supabase', { error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

let isConnected = false;

export async function initializeSupabase(): Promise<void> {
  if (isConnected) {
    logger.info('PostgreSQL already connected');
    return;
  }
  if (!isDbConfigured()) {
    logger.warn('PostgreSQL: DATABASE_URL (ou SUPABASE_*) não definida, skip init');
    return;
  }
  try {
    logger.info('Connecting to PostgreSQL (postgres.js)...');
    const ok = await testConnection();
    if (ok) isConnected = true;
    else throw new Error('Connection test failed');
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export const supabaseService = new SupabaseService();
