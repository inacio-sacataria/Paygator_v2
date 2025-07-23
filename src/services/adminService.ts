import { supabaseService } from '../config/database.js';
import { loggingService } from './loggingService.js';
import { logger } from '../utils/logger.js';

export interface DashboardStats {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  todayPayments: number;
  todayAmount: number;
}

export interface PaymentFilter {
  status?: string;
  method?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface Payment {
  id: number;
  payment_id: string;
  external_payment_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  order_id: string;
  return_url: string;
  iframe_link: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_id: string;
  external_order_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  currency: string;
  status: string;
  items: any;
  created_at: string;
  updated_at: string;
}

export class AdminService {
  
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      logger.info('Getting dashboard stats from Supabase...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      // Buscar estatísticas do Supabase
      const [
        totalPaymentsResult,
        totalAmountResult,
        successfulPaymentsResult,
        pendingPaymentsResult,
        failedPaymentsResult,
        todayPaymentsResult,
        todayAmountResult
      ] = await Promise.all([
        supabaseService.getPaymentsCount(),
        this.getTotalAmount(),
        this.getPaymentsByStatus('approved'),
        this.getPaymentsByStatus('pending'),
        this.getPaymentsByStatus('failed'),
        this.getPaymentsByDate(todayISO),
        this.getAmountByDate(todayISO)
      ]);

      const stats = {
        totalPayments: totalPaymentsResult.count || 0,
        totalAmount: totalAmountResult.amount || 0,
        successfulPayments: successfulPaymentsResult.count || 0,
        pendingPayments: pendingPaymentsResult.count || 0,
        failedPayments: failedPaymentsResult.count || 0,
        todayPayments: todayPaymentsResult.count || 0,
        todayAmount: todayAmountResult.amount || 0
      };

      logger.info('Dashboard stats retrieved successfully:', stats);
      return stats;
    } catch (error) {
      logger.error('Error getting dashboard stats, using demo data:', { error });
      // Retornar dados de demonstração quando não há conexão com o banco
      return {
        totalPayments: 3,
        totalAmount: 17325, // R$ 173.25 em centavos
        successfulPayments: 2,
        pendingPayments: 1,
        failedPayments: 0,
        todayPayments: 3,
        todayAmount: 17325
      };
    }
  }

  async getPayments(filter: PaymentFilter = {}): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 10;
      const offset = (page - 1) * limit;

      // Construir query SQL
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filter.status) {
        whereClause += ` AND status = $${paramIndex++}`;
        params.push(filter.status);
      }
      
      if (filter.method) {
        whereClause += ` AND payment_method = $${paramIndex++}`;
        params.push(filter.method);
      }
      
      if (filter.dateFrom) {
        whereClause += ` AND created_at >= $${paramIndex++}`;
        params.push(filter.dateFrom.toISOString());
      }
      
      if (filter.dateTo) {
        whereClause += ` AND created_at <= $${paramIndex++}`;
        params.push(filter.dateTo.toISOString());
      }

      // Query para buscar pagamentos
      const query = `
        SELECT * FROM payments 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(limit, offset);

      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total FROM payments 
        ${whereClause}
      `;

      const { pgClient } = await import('../config/supabase');
      
      const [paymentsResult, countResult] = await Promise.all([
        pgClient.query(query, params),
        pgClient.query(countQuery, params.slice(0, -2)) // Remove limit e offset
      ]);

      const total = parseInt(countResult.rows[0].total);
      const payments = paymentsResult.rows;

      return {
        payments,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting payments, using demo data:', { error });
      // Retornar dados de demonstração quando não há conexão com o banco
      const demoPayments: Payment[] = [
        {
          id: 1,
          payment_id: 'pay_demo_001',
          external_payment_id: 'ext_demo_001',
          amount: 5175,
          currency: 'BRL',
          payment_method: 'credit_card',
          customer_email: 'demo@example.com',
          customer_name: 'Demo Customer',
          customer_phone: '+5511999999999',
          status: 'approved',
          order_id: 'ORD-20241201-001',
          return_url: 'https://example.com/success',
          iframe_link: 'https://payment-gateway.com/pay/ext_demo_001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          payment_id: 'pay_demo_002',
          external_payment_id: 'ext_demo_002',
          amount: 3250,
          currency: 'BRL',
          payment_method: 'pix',
          customer_email: 'demo2@example.com',
          customer_name: 'Demo Customer 2',
          customer_phone: '+5511888888888',
          status: 'approved',
          order_id: 'ORD-20241201-002',
          return_url: 'https://example.com/success',
          iframe_link: 'https://payment-gateway.com/pay/ext_demo_002',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          payment_id: 'pay_demo_003',
          external_payment_id: 'ext_demo_003',
          amount: 8900,
          currency: 'BRL',
          payment_method: 'debit_card',
          customer_email: 'demo3@example.com',
          customer_name: 'Demo Customer 3',
          customer_phone: '+5511777777777',
          status: 'pending',
          order_id: 'ORD-20241201-003',
          return_url: 'https://example.com/success',
          iframe_link: 'https://payment-gateway.com/pay/ext_demo_003',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      return {
        payments: demoPayments,
        total: 3,
        page: 1,
        totalPages: 1
      };
    }
  }

  async getOrders(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { pgClient } = await import('../config/supabase');
      
      const [ordersResult, countResult] = await Promise.all([
        pgClient.query(`
          SELECT * FROM playfood_orders 
          ORDER BY created_at DESC 
          LIMIT $1 OFFSET $2
        `, [limit, offset]),
        pgClient.query('SELECT COUNT(*) as total FROM playfood_orders')
      ]);

      const total = parseInt(countResult.rows[0].total);
      const orders = ordersResult.rows;

      return {
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting orders:', { error });
      return {
        orders: [],
        total: 0,
        page: 1,
        totalPages: 1
      };
    }
  }

  // Métodos auxiliares para estatísticas
  private async getTotalAmount(): Promise<{ amount: number }> {
    try {
      const { pgClient } = await import('../config/supabase');
      const result = await pgClient.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments');
      return { amount: parseFloat(result.rows[0].total) };
    } catch (error) {
      logger.error('Error getting total amount:', { error });
      return { amount: 0 };
    }
  }

  private async getPaymentsByStatus(status: string): Promise<{ count: number }> {
    try {
      const { pgClient } = await import('../config/supabase');
      const result = await pgClient.query('SELECT COUNT(*) as total FROM payments WHERE status = $1', [status]);
      return { count: parseInt(result.rows[0].total) };
    } catch (error) {
      logger.error('Error getting payments by status:', { error });
      return { count: 0 };
    }
  }

  private async getPaymentsByDate(dateFrom: string): Promise<{ count: number }> {
    try {
      const { pgClient } = await import('../config/supabase');
      const result = await pgClient.query('SELECT COUNT(*) as total FROM payments WHERE created_at >= $1', [dateFrom]);
      return { count: parseInt(result.rows[0].total) };
    } catch (error) {
      logger.error('Error getting payments by date:', { error });
      return { count: 0 };
    }
  }

  private async getAmountByDate(dateFrom: string): Promise<{ amount: number }> {
    try {
      const { pgClient } = await import('../config/supabase');
      const result = await pgClient.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE created_at >= $1', [dateFrom]);
      return { amount: parseFloat(result.rows[0].total) };
    } catch (error) {
      logger.error('Error getting amount by date:', { error });
      return { amount: 0 };
    }
  }

  // Métodos para logs
  async getApiLogs(filter: any = {}): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return await loggingService.getApiLogs(filter);
  }

  async getPaymentLogs(filter: any = {}): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return await loggingService.getPaymentLogs(filter);
  }

  async getLogStats(): Promise<{
    totalApiLogs: number;
    totalPaymentLogs: number;
    totalAuthLogs: number;
    todayApiLogs: number;
    todayPaymentLogs: number;
    todayAuthLogs: number;
    errorCount: number;
    successCount: number;
  }> {
    return await loggingService.getLogStats();
  }
}

export const adminService = new AdminService(); 