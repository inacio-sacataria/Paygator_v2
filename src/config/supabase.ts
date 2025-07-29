import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import { config } from './environment.js';
import { logger } from '../utils/logger.js';

// Create Supabase client
export const supabase = createClient(
  config.database.supabase.url,
  config.database.supabase.anonKey
);

// Create PostgreSQL client for direct database access
export const pgClient = new Client({
  host: process.env['SUPABASE_HOST'] || 'db.llrcdfutvjrrccgytbjh.supabase.co',
  port: parseInt(process.env['SUPABASE_PORT'] || '5432', 10),
  database: process.env['SUPABASE_DATABASE'] || 'postgres',
  user: process.env['SUPABASE_USER'] || 'postgres',
  password: process.env['SUPABASE_PASSWORD'] || '.7K8.PfQWJH@#-d',
  ssl: {
    rejectUnauthorized: false
  },
  // Configurações adicionais para melhor conectividade
  connectionTimeoutMillis: 10000
});

// Database service class for Supabase operations
export class SupabaseService {
  private client = supabase;

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      // Test PostgreSQL connection directly
      const result = await pgClient.query('SELECT COUNT(*) FROM payments');
      logger.info('Supabase PostgreSQL connection successful');
      return true;
    } catch (error) {
      logger.warn('Supabase connection test failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  // Get service status
  async getServiceStatus(): Promise<{ status: string; message: string; data?: any }> {
    try {
      const isConnected = await this.testConnection();
      
      if (isConnected) {
        return {
          status: 'healthy',
          message: 'Supabase database is connected and operational',
          data: {
            provider: 'supabase',
            url: config.database.supabase.url,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Supabase database connection failed',
          data: {
            provider: 'supabase',
            url: config.database.supabase.url,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      logger.error('Error getting Supabase service status', { error });
      return {
        status: 'error',
        message: 'Error checking Supabase service status',
        data: {
          provider: 'supabase',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Create payment record
  async createPayment(paymentData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const query = `
        INSERT INTO payments (
          payment_id, external_payment_id, amount, currency, payment_method,
          customer_email, customer_name, customer_phone, status, order_id,
          return_url, iframe_link, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const values = [
        paymentData.payment_id,
        paymentData.external_payment_id,
        paymentData.amount,
        paymentData.currency,
        paymentData.payment_method,
        paymentData.customer_email,
        paymentData.customer_name,
        paymentData.customer_phone,
        paymentData.status,
        paymentData.order_id,
        paymentData.return_url,
        paymentData.iframe_link,
        paymentData.created_at,
        paymentData.updated_at
      ];

      const result = await pgClient.query(query, values);
      
      logger.info('Payment created successfully in Supabase', { paymentId: result.rows[0]?.payment_id });
      return { success: true, data: result.rows[0] };
    } catch (error) {
      logger.error('Error creating payment in Supabase', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get payment by ID
  async getPayment(paymentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const query = 'SELECT * FROM payments WHERE payment_id = $1';
      const result = await pgClient.query(query, [paymentId]);

      if (result.rows.length === 0) {
        logger.warn('Payment not found in database', { paymentId });
        return { success: false, error: 'Payment not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      logger.error('Error getting payment from Supabase', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update payment
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

  // Get payments count
  async getPaymentsCount(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const query = 'SELECT COUNT(*) FROM payments';
      const result = await pgClient.query(query);
      
      const count = parseInt(result.rows[0].count);
      return { success: true, count };
    } catch (error) {
      logger.error('Error getting payments count from Supabase', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get recent payments
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

// Initialize PostgreSQL connection
let isConnected = false;

export async function initializeSupabase() {
  if (!isConnected) {
    try {
      logger.info('Connecting to PostgreSQL...');
      
      // Tentar conectar com retry
      let retries = 3;
      while (retries > 0) {
        try {
          await pgClient.connect();
          isConnected = true;
          logger.info('PostgreSQL connection established successfully');
          
          // Test the connection
          const testResult = await pgClient.query('SELECT NOW() as current_time');
          logger.info('PostgreSQL test query successful:', { currentTime: testResult.rows[0].current_time });
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          logger.warn(`Connection attempt failed, retrying... (${retries} attempts left)`, { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos antes de tentar novamente
        }
      }
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL after all retries', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  } else {
    logger.info('PostgreSQL already connected');
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService(); 