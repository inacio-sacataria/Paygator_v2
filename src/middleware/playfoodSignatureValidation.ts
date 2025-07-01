import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { PlayfoodWebhookPayload } from '../types/playfood';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  correlationId?: string;
  webhookPayload?: PlayfoodWebhookPayload;
}

export const validatePlayfoodSignature = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const signature = req.headers['x-playfood-signature'] as string;
  const payload = req.body as PlayfoodWebhookPayload;
  
  if (!signature) {
    logger.warn('PlayFood webhook signature missing', { 
      correlationId: req.correlationId,
      ip: req.ip,
      webhookId: payload?.id
    });
    res.status(401).json({
      success: false,
      message: 'PlayFood webhook signature is required',
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  if (!payload) {
    logger.warn('PlayFood webhook payload missing', { 
      correlationId: req.correlationId,
      ip: req.ip
    });
    res.status(400).json({
      success: false,
      message: 'PlayFood webhook payload is required',
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
    logger.warn('Invalid PlayFood webhook signature', { 
      correlationId: req.correlationId,
      ip: req.ip,
      webhookId: payload.id,
      expectedSignature,
      receivedSignature: signature
    });
    res.status(401).json({
      success: false,
      message: 'Invalid PlayFood webhook signature',
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  req.webhookPayload = payload;
  logger.info('PlayFood webhook signature validated successfully', { 
    correlationId: req.correlationId,
    webhookId: payload.id,
    eventType: payload.event_type
  });
  
  next();
};

export const generatePlayfoodWebhookSignature = (payload: Omit<PlayfoodWebhookPayload, 'signature'>, secret: string): string => {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
}; 