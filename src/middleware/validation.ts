import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { WebhookPayload, EventType } from '../types/webhook';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './logging';
import { Schema } from 'joi';

// Schema de validação para o payload do webhook
const webhookPayloadSchema = Joi.object({
  id: Joi.string().required(),
  event_type: Joi.string().valid('payment.created', 'payment.completed', 'payment.failed', 'payment.refunded').required(),
  timestamp: Joi.string().isoDate().required(),
  data: Joi.object({
    payment_id: Joi.string().required(),
    order_id: Joi.string().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().valid('BRL', 'USD', 'EUR').required(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').required(),
    payment_method: Joi.string().required(),
    provider: Joi.string().required(),
    customer: Joi.object({
      id: Joi.string().required(),
      email: Joi.string().email().required(),
      name: Joi.string().required()
    }).required(),
    metadata: Joi.object().optional()
  }).required(),
  signature: Joi.string().required()
});

// Schema para configuração de webhook
const webhookConfigSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  url: Joi.string().uri().required(),
  events: Joi.array().items(
    Joi.string().valid('payment.created', 'payment.completed', 'payment.failed', 'payment.refunded')
  ).min(1).required(),
  secret: Joi.string().min(1).max(255).required()
});

// Schema para atualização de webhook
const webhookUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  url: Joi.string().uri().optional(),
  events: Joi.array().items(
    Joi.string().valid('payment.created', 'payment.completed', 'payment.failed', 'payment.refunded')
  ).min(1).optional(),
  secret: Joi.string().min(1).max(255).optional(),
  is_active: Joi.boolean().optional()
});

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      logger.warn('Validation error', {
        correlationId: req.headers['x-correlation-id'],
        error: error.details[0]?.message || 'Unknown validation error',
        path: error.details[0]?.path || 'unknown'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Validation failed',
        errors: error.details.map(detail => detail.message),
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'validation_error'
      });
      return;
    }
    
    next();
  };
};

export const validateQuery = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      logger.warn('Query validation error', {
        correlationId: req.headers['x-correlation-id'],
        error: error.details[0]?.message || 'Unknown validation error',
        path: error.details[0]?.path || 'unknown'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Query validation failed',
        errors: error.details.map(detail => detail.message),
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'validation_error'
      });
      return;
    }
    
    next();
  };
};

export const validateParams = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      logger.warn('Params validation error', {
        correlationId: req.headers['x-correlation-id'],
        error: error.details[0]?.message || 'Unknown validation error',
        path: error.details[0]?.path || 'unknown'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Parameters validation failed',
        errors: error.details.map(detail => detail.message),
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'validation_error'
      });
      return;
    }
    
    next();
  };
};

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    correlationId: req.headers['x-correlation-id'],
    error: error.message,
    stack: error.stack
  });

  res.status(500).json({
    success: false,
    data: null,
    message: 'Internal server error',
    errors: [error.message],
    timestamp: new Date().toISOString(),
    correlation_id: req.headers['x-correlation-id'] || 'internal_error'
  });
};

export const validateWebhookPayload = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const { error, value } = webhookPayloadSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    
    logger.warn('Webhook payload validation failed', {
      correlationId: req.correlationId,
      errors: errorMessages,
      payload: req.body
    });

    res.status(400).json({
      success: false,
      message: 'Invalid webhook payload',
      errors: errorMessages,
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  // Atualizar o body com os dados validados
  req.body = value;
  next();
};

export const validateWebhookConfig = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const { error, value } = webhookConfigSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    
    logger.warn('Webhook config validation failed', {
      correlationId: req.correlationId,
      errors: errorMessages,
      payload: req.body
    });

    res.status(400).json({
      success: false,
      message: 'Invalid webhook configuration',
      errors: errorMessages,
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  req.body = value;
  next();
};

export const validateWebhookUpdate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const { error, value } = webhookUpdateSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    
    logger.warn('Webhook update validation failed', {
      correlationId: req.correlationId,
      webhookId: req.params['id'],
      errors: errorMessages,
      payload: req.body
    });

    res.status(400).json({
      success: false,
      message: 'Invalid webhook update data',
      errors: errorMessages,
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  req.body = value;
  next();
};

export const validatePagination = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;

  if (page < 1) {
    res.status(400).json({
      success: false,
      message: 'Page must be greater than 0',
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100',
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  next();
}; 