import { pgClient } from '../config/supabase';
import { logger } from '../utils/logger.js';

export interface ApiLogData {
  correlationId: string;
  method: string;
  url: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  apiKey?: string | undefined;
  webhookSignature?: string | undefined;
  requestHeaders?: any;
  requestBody?: any;
  responseStatus?: number;
  responseBody?: string;
  responseTimeMs?: number;
  contentLength?: number;
  errorMessage?: string | undefined;
  serviceName?: string | undefined;
}

export interface PaymentLogData {
  paymentId: string;
  externalPaymentId?: string;
  action: 'created' | 'updated' | 'status_changed' | 'failed';
  previousStatus?: string;
  newStatus?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  errorMessage?: string;
  metadata?: any;
  correlationId?: string;
}

export interface AuthLogData {
  correlationId: string;
  apiKey?: string;
  ipAddress?: string;
  userAgent?: string;
  action: 'login' | 'logout' | 'auth_success' | 'auth_failed';
  status: 'success' | 'failed';
  errorMessage?: string;
}

export class LoggingService {
  
  // Log de chamadas da API
  async logApiCall(logData: ApiLogData): Promise<void> {
    try {
      const query = `
        INSERT INTO api_logs (
          correlation_id, method, url, ip_address, user_agent, 
          api_key, webhook_signature, request_headers, request_body,
          response_status, response_body, response_time_ms, content_length,
          error_message, service_name, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      `;
      
      const values = [
        logData.correlationId,
        logData.method,
        logData.url,
        logData.ipAddress,
        logData.userAgent,
        logData.apiKey,
        logData.webhookSignature,
        logData.requestHeaders ? JSON.stringify(logData.requestHeaders) : null,
        logData.requestBody ? JSON.stringify(logData.requestBody) : null,
        logData.responseStatus,
        logData.responseBody,
        logData.responseTimeMs,
        logData.contentLength,
        logData.errorMessage,
        logData.serviceName || 'paygator'
      ];

      await pgClient.query(query, values);
      logger.debug('API log saved successfully', { correlationId: logData.correlationId });
    } catch (error) {
      logger.error('Failed to save API log', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: logData.correlationId 
      });
    }
  }

  // Log de pagamentos
  async logPayment(logData: PaymentLogData): Promise<void> {
    try {
      const query = `
        INSERT INTO payment_logs (
          payment_id, external_payment_id, action, previous_status, new_status,
          amount, currency, customer_email, error_message, metadata, 
          correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `;
      
      const values = [
        logData.paymentId,
        logData.externalPaymentId,
        logData.action,
        logData.previousStatus,
        logData.newStatus,
        logData.amount,
        logData.currency,
        logData.customerEmail,
        logData.errorMessage,
        logData.metadata ? JSON.stringify(logData.metadata) : null,
        logData.correlationId
      ];

      await pgClient.query(query, values);
      logger.debug('Payment log saved successfully', { paymentId: logData.paymentId });
    } catch (error) {
      logger.error('Failed to save payment log', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId: logData.paymentId 
      });
    }
  }

  // Log de autenticação
  async logAuth(logData: AuthLogData): Promise<void> {
    try {
      const query = `
        INSERT INTO auth_logs (
          correlation_id, api_key, ip_address, user_agent, action, 
          status, error_message, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `;
      
      const values = [
        logData.correlationId,
        logData.apiKey,
        logData.ipAddress,
        logData.userAgent,
        logData.action,
        logData.status,
        logData.errorMessage
      ];

      await pgClient.query(query, values);
      logger.debug('Auth log saved successfully', { correlationId: logData.correlationId });
    } catch (error) {
      logger.error('Failed to save auth log', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: logData.correlationId 
      });
    }
  }

  // Buscar logs de API
  async getApiLogs(filters: {
    correlationId?: string;
    method?: string;
    url?: string;
    apiKey?: string;
    status?: number;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.correlationId) {
        whereClause += ` AND correlation_id = $${paramIndex++}`;
        params.push(filters.correlationId);
      }

      if (filters.method) {
        whereClause += ` AND method = $${paramIndex++}`;
        params.push(filters.method);
      }

      if (filters.url) {
        whereClause += ` AND url ILIKE $${paramIndex++}`;
        params.push(`%${filters.url}%`);
      }

      if (filters.apiKey) {
        whereClause += ` AND api_key = $${paramIndex++}`;
        params.push(filters.apiKey);
      }

      if (filters.status) {
        whereClause += ` AND response_status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters.dateFrom) {
        whereClause += ` AND created_at >= $${paramIndex++}`;
        params.push(filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        whereClause += ` AND created_at <= $${paramIndex++}`;
        params.push(filters.dateTo.toISOString());
      }

      const query = `
        SELECT * FROM api_logs 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total FROM api_logs 
        ${whereClause}
      `;

      const [logsResult, countResult] = await Promise.all([
        pgClient.query(query, params),
        pgClient.query(countQuery, params.slice(0, -2))
      ]);

      const total = parseInt(countResult.rows[0].total);
      const logs = logsResult.rows;

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Failed to get API logs', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        logs: [],
        total: 0,
        page: 1,
        totalPages: 1
      };
    }
  }

  // Buscar logs de pagamentos
  async getPaymentLogs(filters: {
    paymentId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.paymentId) {
        whereClause += ` AND payment_id = $${paramIndex++}`;
        params.push(filters.paymentId);
      }

      if (filters.action) {
        whereClause += ` AND action = $${paramIndex++}`;
        params.push(filters.action);
      }

      if (filters.dateFrom) {
        whereClause += ` AND created_at >= $${paramIndex++}`;
        params.push(filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        whereClause += ` AND created_at <= $${paramIndex++}`;
        params.push(filters.dateTo.toISOString());
      }

      const query = `
        SELECT * FROM payment_logs 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total FROM payment_logs 
        ${whereClause}
      `;

      const [logsResult, countResult] = await Promise.all([
        pgClient.query(query, params),
        pgClient.query(countQuery, params.slice(0, -2))
      ]);

      const total = parseInt(countResult.rows[0].total);
      const logs = logsResult.rows;

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Failed to get payment logs', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        logs: [],
        total: 0,
        page: 1,
        totalPages: 1
      };
    }
  }

  // Estatísticas de logs
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
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [
        totalApiLogs,
        totalPaymentLogs,
        totalAuthLogs,
        todayApiLogs,
        todayPaymentLogs,
        todayAuthLogs,
        errorCount,
        successCount
      ] = await Promise.all([
        pgClient.query('SELECT COUNT(*) as total FROM api_logs'),
        pgClient.query('SELECT COUNT(*) as total FROM payment_logs'),
        pgClient.query('SELECT COUNT(*) as total FROM auth_logs'),
        pgClient.query('SELECT COUNT(*) as total FROM api_logs WHERE created_at >= $1', [todayISO]),
        pgClient.query('SELECT COUNT(*) as total FROM payment_logs WHERE created_at >= $1', [todayISO]),
        pgClient.query('SELECT COUNT(*) as total FROM auth_logs WHERE created_at >= $1', [todayISO]),
        pgClient.query('SELECT COUNT(*) as total FROM api_logs WHERE response_status >= 400'),
        pgClient.query('SELECT COUNT(*) as total FROM api_logs WHERE response_status < 400')
      ]);

      return {
        totalApiLogs: parseInt(totalApiLogs.rows[0].total),
        totalPaymentLogs: parseInt(totalPaymentLogs.rows[0].total),
        totalAuthLogs: parseInt(totalAuthLogs.rows[0].total),
        todayApiLogs: parseInt(todayApiLogs.rows[0].total),
        todayPaymentLogs: parseInt(todayPaymentLogs.rows[0].total),
        todayAuthLogs: parseInt(todayAuthLogs.rows[0].total),
        errorCount: parseInt(errorCount.rows[0].total),
        successCount: parseInt(successCount.rows[0].total)
      };
    } catch (error) {
      logger.error('Failed to get log stats', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        totalApiLogs: 0,
        totalPaymentLogs: 0,
        totalAuthLogs: 0,
        todayApiLogs: 0,
        todayPaymentLogs: 0,
        todayAuthLogs: 0,
        errorCount: 0,
        successCount: 0
      };
    }
  }
}

export const loggingService = new LoggingService(); 