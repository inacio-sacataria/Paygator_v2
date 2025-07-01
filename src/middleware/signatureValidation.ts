import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { WebhookPayload } from '../types/webhook';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  correlationId?: string;
  webhookPayload?: WebhookPayload;
}

export const validateWebhookSignature = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const signature = req.headers['x-webhook-signature'] as string;
  const payload = req.body as WebhookPayload;
  
  if (!signature) {
    logger.warn('Webhook signature missing', { 
      correlationId: req.correlationId,
      ip: req.ip,
      webhookId: payload?.id
    });
    res.status(401).json({
      success: false,
      message: 'Webhook signature is required',
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  if (!payload) {
    logger.warn('Webhook payload missing', { 
      correlationId: req.correlationId,
      ip: req.ip
    });
    res.status(400).json({
      success: false,
      message: 'Webhook payload is required',
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  // Remove a assinatura do payload para calcular a assinatura esperada
  const { signature: payloadSignature, ...payloadWithoutSignature } = payload;
  const payloadString = JSON.stringify(payloadWithoutSignature);
  
  const expectedSignature = crypto
    .createHmac('sha256', config.security.webhookSecret)
    .update(payloadString)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Invalid webhook signature', { 
      correlationId: req.correlationId,
      ip: req.ip,
      webhookId: payload.id,
      expectedSignature,
      receivedSignature: signature
    });
    res.status(401).json({
      success: false,
      message: 'Invalid webhook signature',
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  req.webhookPayload = payload;
  logger.info('Webhook signature validated successfully', { 
    correlationId: req.correlationId,
    webhookId: payload.id,
    eventType: payload.event_type
  });
  
  next();
};

export const generateWebhookSignature = (payload: Omit<WebhookPayload, 'signature'>, secret: string): string => {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
}; 