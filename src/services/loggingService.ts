import { sql, isDbConfigured } from '../config/db';
import { logger } from '../utils/logger';

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
  async logApiCall(logData: ApiLogData): Promise<void> {
    if (!sql || !isDbConfigured()) return;
    try {
      await sql`
        INSERT INTO api_logs (
          correlation_id, method, url, ip_address, user_agent,
          api_key, webhook_signature, request_headers, request_body,
          response_status, response_body, response_time_ms, content_length,
          error_message, service_name, created_at
        ) VALUES (
          ${logData.correlationId},
          ${logData.method},
          ${logData.url},
          ${logData.ipAddress ?? null},
          ${logData.userAgent ?? null},
          ${logData.apiKey ?? null},
          ${logData.webhookSignature ?? null},
          ${logData.requestHeaders ? JSON.stringify(logData.requestHeaders) : null},
          ${logData.requestBody ? JSON.stringify(logData.requestBody) : null},
          ${logData.responseStatus ?? null},
          ${logData.responseBody ?? null},
          ${logData.responseTimeMs ?? null},
          ${logData.contentLength ?? null},
          ${logData.errorMessage ?? null},
          ${logData.serviceName ?? 'paygator'},
          NOW()
        )
      `;
      logger.debug('API log saved successfully', { correlationId: logData.correlationId });
    } catch (error) {
      logger.error('Failed to save API log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: logData.correlationId,
      });
    }
  }

  async logPayment(logData: PaymentLogData): Promise<void> {
    if (!sql || !isDbConfigured()) return;
    try {
      await sql`
        INSERT INTO payment_logs (
          payment_id, external_payment_id, action, previous_status, new_status,
          amount, currency, customer_email, error_message, metadata,
          correlation_id, created_at
        ) VALUES (
          ${logData.paymentId},
          ${logData.externalPaymentId ?? null},
          ${logData.action},
          ${logData.previousStatus ?? null},
          ${logData.newStatus ?? null},
          ${logData.amount ?? null},
          ${logData.currency ?? null},
          ${logData.customerEmail ?? null},
          ${logData.errorMessage ?? null},
          ${logData.metadata ? JSON.stringify(logData.metadata) : null},
          ${logData.correlationId ?? null},
          NOW()
        )
      `;
      logger.debug('Payment log saved successfully', { paymentId: logData.paymentId });
    } catch (error) {
      logger.error('Failed to save payment log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId: logData.paymentId,
      });
    }
  }

  async logAuth(logData: AuthLogData): Promise<void> {
    if (!sql || !isDbConfigured()) return;
    try {
      await sql`
        INSERT INTO auth_logs (
          correlation_id, api_key, ip_address, user_agent, action,
          status, error_message, created_at
        ) VALUES (
          ${logData.correlationId},
          ${logData.apiKey ?? null},
          ${logData.ipAddress ?? null},
          ${logData.userAgent ?? null},
          ${logData.action},
          ${logData.status},
          ${logData.errorMessage ?? null},
          NOW()
        )
      `;
      logger.debug('Auth log saved successfully', { correlationId: logData.correlationId });
    } catch (error) {
      logger.error('Failed to save auth log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: logData.correlationId,
      });
    }
  }

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
    if (!sql || !isDbConfigured()) {
      return { logs: [], total: 0, page: 1, totalPages: 1 };
    }
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      const [logs, countResult] = await Promise.all([
        sql`
          SELECT * FROM api_logs
          WHERE 1=1
          ${filters.correlationId ? sql`AND correlation_id = ${filters.correlationId}` : sql``}
          ${filters.method ? sql`AND method = ${filters.method}` : sql``}
          ${filters.url ? sql`AND url ILIKE ${'%' + filters.url + '%'}` : sql``}
          ${filters.apiKey ? sql`AND api_key = ${filters.apiKey}` : sql``}
          ${filters.status !== undefined ? sql`AND response_status = ${filters.status}` : sql``}
          ${filters.dateFrom ? sql`AND created_at >= ${filters.dateFrom.toISOString()}` : sql``}
          ${filters.dateTo ? sql`AND created_at <= ${filters.dateTo.toISOString()}` : sql``}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`
          SELECT COUNT(*)::int as total FROM api_logs
          WHERE 1=1
          ${filters.correlationId ? sql`AND correlation_id = ${filters.correlationId}` : sql``}
          ${filters.method ? sql`AND method = ${filters.method}` : sql``}
          ${filters.url ? sql`AND url ILIKE ${'%' + filters.url + '%'}` : sql``}
          ${filters.apiKey ? sql`AND api_key = ${filters.apiKey}` : sql``}
          ${filters.status !== undefined ? sql`AND response_status = ${filters.status}` : sql``}
          ${filters.dateFrom ? sql`AND created_at >= ${filters.dateFrom.toISOString()}` : sql``}
          ${filters.dateTo ? sql`AND created_at <= ${filters.dateTo.toISOString()}` : sql``}
        `,
      ]);

      const total = Number(countResult[0]?.['total'] ?? 0);
      return {
        logs: Array.isArray(logs) ? logs : [],
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      logger.error('Failed to get API logs', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { logs: [], total: 0, page: 1, totalPages: 1 };
    }
  }

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
    if (!sql || !isDbConfigured()) {
      return { logs: [], total: 0, page: 1, totalPages: 1 };
    }
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      const [logs, countResult] = await Promise.all([
        sql`
          SELECT * FROM payment_logs
          WHERE 1=1
          ${filters.paymentId ? sql`AND payment_id = ${filters.paymentId}` : sql``}
          ${filters.action ? sql`AND action = ${filters.action}` : sql``}
          ${filters.dateFrom ? sql`AND created_at >= ${filters.dateFrom.toISOString()}` : sql``}
          ${filters.dateTo ? sql`AND created_at <= ${filters.dateTo.toISOString()}` : sql``}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`
          SELECT COUNT(*)::int as total FROM payment_logs
          WHERE 1=1
          ${filters.paymentId ? sql`AND payment_id = ${filters.paymentId}` : sql``}
          ${filters.action ? sql`AND action = ${filters.action}` : sql``}
          ${filters.dateFrom ? sql`AND created_at >= ${filters.dateFrom.toISOString()}` : sql``}
          ${filters.dateTo ? sql`AND created_at <= ${filters.dateTo.toISOString()}` : sql``}
        `,
      ]);

      const total = Number(countResult[0]?.['total'] ?? 0);
      return {
        logs: Array.isArray(logs) ? logs : [],
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      logger.error('Failed to get payment logs', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { logs: [], total: 0, page: 1, totalPages: 1 };
    }
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
    const empty = {
      totalApiLogs: 0,
      totalPaymentLogs: 0,
      totalAuthLogs: 0,
      todayApiLogs: 0,
      todayPaymentLogs: 0,
      todayAuthLogs: 0,
      errorCount: 0,
      successCount: 0,
    };
    if (!sql || !isDbConfigured()) return empty;
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
        successCount,
      ] = await Promise.all([
        sql`SELECT COUNT(*)::int as total FROM api_logs`,
        sql`SELECT COUNT(*)::int as total FROM payment_logs`,
        sql`SELECT COUNT(*)::int as total FROM auth_logs`,
        sql`SELECT COUNT(*)::int as total FROM api_logs WHERE created_at >= ${todayISO}`,
        sql`SELECT COUNT(*)::int as total FROM payment_logs WHERE created_at >= ${todayISO}`,
        sql`SELECT COUNT(*)::int as total FROM auth_logs WHERE created_at >= ${todayISO}`,
        sql`SELECT COUNT(*)::int as total FROM api_logs WHERE response_status >= 400`,
        sql`SELECT COUNT(*)::int as total FROM api_logs WHERE response_status < 400`,
      ]);

      return {
        totalApiLogs: Number(totalApiLogs[0]?.['total'] ?? 0),
        totalPaymentLogs: Number(totalPaymentLogs[0]?.['total'] ?? 0),
        totalAuthLogs: Number(totalAuthLogs[0]?.['total'] ?? 0),
        todayApiLogs: Number(todayApiLogs[0]?.['total'] ?? 0),
        todayPaymentLogs: Number(todayPaymentLogs[0]?.['total'] ?? 0),
        todayAuthLogs: Number(todayAuthLogs[0]?.['total'] ?? 0),
        errorCount: Number(errorCount[0]?.['total'] ?? 0),
        successCount: Number(successCount[0]?.['total'] ?? 0),
      };
    } catch (error) {
      logger.error('Failed to get log stats', { error: error instanceof Error ? error.message : 'Unknown error' });
      return empty;
    }
  }
}

export const loggingService = new LoggingService();
