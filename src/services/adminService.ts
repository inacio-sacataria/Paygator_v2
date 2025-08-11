import { sqliteService } from './sqliteService';
import { loggingService } from './loggingService';
import { logger } from '../utils/logger';

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
      logger.info('Getting dashboard stats from SQLite...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      // Buscar estatísticas do SQLite
      const stats = await sqliteService.getStatistics();
      
      // Calcular estatísticas específicas
      const successfulPayments = stats.recentPayments.filter(p => p.status === 'approved').length;
      const pendingPayments = stats.recentPayments.filter(p => p.status === 'pending').length;
      const failedPayments = stats.recentPayments.filter(p => p.status === 'failed').length;
      
      const totalAmount = stats.recentPayments.reduce((sum, p) => sum + p.amount, 0);
      const todayPayments = stats.recentPayments.filter(p => 
        new Date(p.created_at!).toDateString() === today.toDateString()
      ).length;
      const todayAmount = stats.recentPayments.filter(p => 
        new Date(p.created_at!).toDateString() === today.toDateString()
      ).reduce((sum, p) => sum + p.amount, 0);

      const dashboardStats = {
        totalPayments: stats.totalPayments,
        totalAmount: totalAmount,
        successfulPayments,
        pendingPayments,
        failedPayments,
        todayPayments,
        todayAmount
      };

      logger.info('Dashboard stats retrieved successfully:', dashboardStats);
      return dashboardStats;
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

      // Buscar pagamentos do SQLite
      const payments = await sqliteService.getPayments(limit, offset);
      
      // Filtrar por status se especificado
      let filteredPayments = payments;
      if (filter.status) {
        filteredPayments = payments.filter(p => p.status === filter.status);
      }
      
      // Filtrar por método se especificado
      if (filter.method) {
        filteredPayments = payments.filter(p => p.provider === filter.method);
      }
      
      // Filtrar por data se especificado
      if (filter.dateFrom) {
        filteredPayments = filteredPayments.filter(p => 
          new Date(p.created_at!) >= filter.dateFrom!
        );
      }
      
      if (filter.dateTo) {
        filteredPayments = filteredPayments.filter(p => 
          new Date(p.created_at!) <= filter.dateTo!
        );
      }

      // Converter para o formato esperado
      const formattedPayments: Payment[] = filteredPayments.map(p => ({
        id: p.id!,
        payment_id: p.payment_id,
        external_payment_id: p.payment_id, // Usar payment_id como external_payment_id
        amount: p.amount,
        currency: p.currency || 'BRL',
        payment_method: p.provider,
        customer_email: 'demo@example.com', // Placeholder
        customer_name: 'Demo Customer', // Placeholder
        customer_phone: '+5511999999999', // Placeholder
        status: p.status,
        order_id: p.payment_id, // Usar payment_id como order_id
        return_url: 'https://example.com/success', // Placeholder
        iframe_link: `https://payment-gateway.com/pay/${p.payment_id}`, // Placeholder
        created_at: p.created_at!,
        updated_at: p.updated_at!
      }));

      return {
        payments: formattedPayments,
        total: formattedPayments.length,
        page,
        totalPages: Math.ceil(formattedPayments.length / limit)
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
      
      // Buscar pedidos do SQLite
      const orders = await sqliteService.getPlayfoodOrders(limit, offset);
      
      // Converter para o formato esperado
      const formattedOrders: Order[] = orders.map(o => ({
        id: o.id!,
        order_id: o.order_id,
        external_order_id: o.order_id, // Usar order_id como external_order_id
        customer_id: o.customer_id || 'demo_customer',
        customer_name: 'Demo Customer', // Placeholder
        customer_email: 'demo@example.com', // Placeholder
        customer_phone: '+5511999999999', // Placeholder
        total_amount: o.total_amount,
        currency: 'BRL',
        status: o.status,
        items: o.items ? JSON.parse(o.items) : [],
        created_at: o.created_at!,
        updated_at: o.updated_at!
      }));

      return {
        orders: formattedOrders,
        total: formattedOrders.length,
        page,
        totalPages: Math.ceil(formattedOrders.length / limit)
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