import { Request, Response } from 'express';
import { WebhookPayload, WebhookResponse, EventType } from '../types/webhook';
import { WebhookService } from '../services/webhookService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/logging';

export class WebhookController {
  private webhookService: WebhookService;

  constructor() {
    this.webhookService = new WebhookService();
  }

  public processWebhook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const payload = req.body;
      const correlationId = req.correlationId || 'unknown';

      logger.info('Processing webhook', {
        correlationId,
        webhookId: payload.id,
        eventType: payload.event_type
      });

      const result = await this.webhookService.processWebhook(payload, correlationId);

      res.status(200).json({
        success: result.success,
        data: result,
        message: result.message,
        timestamp: new Date().toISOString(),
        correlation_id: correlationId
      });

    } catch (error) {
      logger.error('Error processing webhook', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to process webhook',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public createWebhookConfig = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const configData = req.body;

      const webhookConfig = await this.webhookService.createWebhookConfig(configData);

      res.status(201).json({
        success: true,
        data: webhookConfig,
        message: 'Webhook configuration created successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error creating webhook config', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Failed to create webhook configuration',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public listWebhookConfigs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;

      const webhookConfigs = await this.webhookService.listWebhookConfigs(page, limit);

      res.status(200).json({
        success: true,
        data: webhookConfigs.data,
        pagination: webhookConfigs.pagination,
        message: 'Webhook configurations retrieved successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error listing webhook configs', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve webhook configurations',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public updateWebhookConfig = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Webhook ID is required',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const webhookConfig = await this.webhookService.updateWebhookConfig(id, updateData);

      res.status(200).json({
        success: true,
        data: webhookConfig,
        message: 'Webhook configuration updated successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error updating webhook config', {
        correlationId: req.correlationId,
        webhookId: req.params['id'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Failed to update webhook configuration',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public deleteWebhookConfig = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Webhook ID is required',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      await this.webhookService.deleteWebhookConfig(id);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Webhook configuration deleted successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error deleting webhook config', {
        correlationId: req.correlationId,
        webhookId: req.params['id'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Failed to delete webhook configuration',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public getWebhookStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const status = await this.webhookService.getWebhookStatus();

      res.status(200).json({
        success: true,
        data: status,
        message: 'Webhook status retrieved successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error getting webhook status', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve webhook status',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public getWebhookLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 50;
      const webhookId = req.query['webhook_id'] as string;
      const eventType = req.query['event_type'] as string;

      const logs = await this.webhookService.getWebhookLogs(page, limit, webhookId, eventType);

      res.status(200).json({
        success: true,
        data: logs.data,
        pagination: logs.pagination,
        message: 'Webhook logs retrieved successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error getting webhook logs', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve webhook logs',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };
} 