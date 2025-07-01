import { WebhookPayload, WebhookResponse, WebhookConfig, WebhookLog, EventType, PaginatedResponse } from '../types/webhook';
import { WebhookConfig as WebhookConfigModel } from '../models/WebhookConfig';
import { WebhookLog as WebhookLogModel } from '../models/WebhookLog';
import { logger } from '../utils/logger';
import { generateWebhookSignature } from '../middleware/signatureValidation';
import { config } from '../config/environment';

export class WebhookService {
  public async processWebhook(payload: WebhookPayload, correlationId?: string): Promise<WebhookResponse> {
    const startTime = Date.now();
    let success = false;
    let errorMessage: string | undefined;

    try {
      logger.info('Starting webhook processing', {
        correlationId,
        webhookId: payload.id,
        eventType: payload.event_type,
        paymentId: payload.data.payment_id
      });

      // Processar o evento baseado no tipo
      switch (payload.event_type) {
        case 'payment.created':
          await this.handlePaymentCreated(payload);
          break;
        case 'payment.completed':
          await this.handlePaymentCompleted(payload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload);
          break;
        case 'payment.refunded':
          await this.handlePaymentRefunded(payload);
          break;
        default:
          throw new Error(`Unsupported event type: ${payload.event_type}`);
      }

      success = true;
      logger.info('Webhook processed successfully', {
        correlationId,
        webhookId: payload.id,
        eventType: payload.event_type,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing webhook', {
        correlationId,
        webhookId: payload.id,
        error: errorMessage,
        processingTime: Date.now() - startTime
      });
    }

    // Salvar log do webhook
    await this.saveWebhookLog(payload, success, errorMessage, Date.now() - startTime, correlationId);

    const response: WebhookResponse = {
      success,
      message: success ? 'Webhook processed successfully' : `Webhook processing failed: ${errorMessage}`,
      webhook_id: payload.id,
      processed_at: new Date().toISOString()
    };

    if (errorMessage) {
      response.errors = [errorMessage];
    }

    return response;
  }

  private async handlePaymentCreated(payload: WebhookPayload): Promise<void> {
    logger.info('Handling payment.created event', {
      paymentId: payload.data.payment_id,
      orderId: payload.data.order_id,
      amount: payload.data.amount,
      currency: payload.data.currency
    });

    // Implementar lógica específica para pagamento criado
    // Por exemplo: atualizar status do pedido, enviar notificação, etc.
  }

  private async handlePaymentCompleted(payload: WebhookPayload): Promise<void> {
    logger.info('Handling payment.completed event', {
      paymentId: payload.data.payment_id,
      orderId: payload.data.order_id,
      amount: payload.data.amount,
      currency: payload.data.currency
    });

    // Implementar lógica específica para pagamento completado
    // Por exemplo: confirmar pedido, enviar email de confirmação, etc.
  }

  private async handlePaymentFailed(payload: WebhookPayload): Promise<void> {
    logger.info('Handling payment.failed event', {
      paymentId: payload.data.payment_id,
      orderId: payload.data.order_id,
      amount: payload.data.amount,
      currency: payload.data.currency
    });

    // Implementar lógica específica para pagamento falhado
    // Por exemplo: notificar cliente, tentar pagamento alternativo, etc.
  }

  private async handlePaymentRefunded(payload: WebhookPayload): Promise<void> {
    logger.info('Handling payment.refunded event', {
      paymentId: payload.data.payment_id,
      orderId: payload.data.order_id,
      amount: payload.data.amount,
      currency: payload.data.currency
    });

    // Implementar lógica específica para pagamento reembolsado
    // Por exemplo: processar reembolso, atualizar estoque, etc.
  }

  private async saveWebhookLog(
    payload: WebhookPayload,
    success: boolean,
    errorMessage?: string,
    processingTimeMs?: number,
    correlationId?: string
  ): Promise<void> {
    try {
      const log = new WebhookLogModel({
        webhook_id: payload.id,
        event_type: payload.event_type,
        payload: payload,
        response_status: success ? 200 : 400,
        response_body: success ? 'Success' : errorMessage || 'Unknown error',
        processing_time_ms: processingTimeMs || 0,
        success: success,
        error_message: errorMessage,
        retry_count: 0
      });

      await log.save();

      logger.debug('Webhook log saved', {
        correlationId,
        logId: log._id,
        webhookId: payload.id,
        success
      });

    } catch (error) {
      logger.error('Error saving webhook log', {
        correlationId,
        webhookId: payload.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async createWebhookConfig(data: {
    name: string;
    url: string;
    events: EventType[];
    secret: string;
  }): Promise<WebhookConfig> {
    const webhookConfig = new WebhookConfigModel({
      name: data.name,
      url: data.url,
      events: data.events,
      secret: data.secret,
      is_active: true
    });

    const saved = await webhookConfig.save();
    
    return {
      id: (saved._id as any).toString(),
      name: saved.name,
      url: saved.url,
      events: saved.events,
      secret: saved.secret,
      is_active: saved.is_active,
      created_at: saved.created_at,
      updated_at: saved.updated_at
    };
  }

  public async listWebhookConfigs(page: number = 1, limit: number = 10): Promise<PaginatedResponse<WebhookConfig>> {
    const skip = (page - 1) * limit;
    
    const [webhooks, total] = await Promise.all([
      WebhookConfigModel.find()
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WebhookConfigModel.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: webhooks.map((wc: any) => ({
        id: wc._id.toString(),
        name: wc.name,
        url: wc.url,
        events: wc.events,
        secret: wc.secret,
        is_active: wc.is_active,
        created_at: wc.created_at,
        updated_at: wc.updated_at
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

  public async updateWebhookConfig(id: string, updateData: Partial<WebhookConfig>): Promise<WebhookConfig> {
    const webhookConfig = await WebhookConfigModel.findById(id);
    
    if (!webhookConfig) {
      throw new Error('Webhook configuration not found');
    }

    Object.assign(webhookConfig, updateData);
    const saved = await webhookConfig.save();

    return {
      id: (saved._id as any).toString(),
      name: saved.name,
      url: saved.url,
      events: saved.events,
      secret: saved.secret,
      is_active: saved.is_active,
      created_at: saved.created_at,
      updated_at: saved.updated_at
    };
  }

  public async deleteWebhookConfig(id: string): Promise<void> {
    const webhookConfig = await WebhookConfigModel.findById(id);
    
    if (!webhookConfig) {
      throw new Error('Webhook configuration not found');
    }

    await webhookConfig.deleteOne();
  }

  public async getWebhookStatus(): Promise<any> {
    const [totalWebhooks, activeWebhooks, totalLogs, successfulLogs, failedLogs] = await Promise.all([
      WebhookConfigModel.countDocuments(),
      WebhookConfigModel.countDocuments({ is_active: true }),
      WebhookLogModel.countDocuments(),
      WebhookLogModel.countDocuments({ success: true }),
      WebhookLogModel.countDocuments({ success: false })
    ]);

    return {
      total_webhooks: totalWebhooks,
      active_webhooks: activeWebhooks,
      total_logs: totalLogs,
      successful_logs: successfulLogs,
      failed_logs: failedLogs,
      success_rate: totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 0
    };
  }

  public async getWebhookLogs(
    page: number = 1,
    limit: number = 50,
    webhookId?: string,
    eventType?: string
  ): Promise<PaginatedResponse<WebhookLog>> {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (webhookId) where.webhook_id = webhookId;
    if (eventType) where.event_type = eventType;

    const [logs, total] = await Promise.all([
      WebhookLogModel.find(where)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WebhookLogModel.countDocuments(where)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: logs.map((log: any) => ({
        id: log._id.toString(),
        webhook_id: log.webhook_id,
        event_type: log.event_type,
        payload: log.payload,
        response_status: log.response_status,
        response_body: log.response_body,
        processing_time_ms: log.processing_time_ms,
        success: log.success,
        error_message: log.error_message || undefined,
        retry_count: log.retry_count,
        created_at: log.created_at
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
} 