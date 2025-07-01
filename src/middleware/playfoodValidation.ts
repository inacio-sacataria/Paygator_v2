import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './logging';

// Schema para criação de pedido
const createOrderSchema = Joi.object({
  reference_id: Joi.string().required(),
  customer: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional(),
    document: Joi.string().optional()
  }).required(),
  items: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      description: Joi.string().optional(),
      quantity: Joi.number().integer().positive().required(),
      unit_price: Joi.number().positive().required(),
      total_price: Joi.number().positive().required(),
      category: Joi.string().optional(),
      notes: Joi.string().optional()
    })
  ).min(1).required(),
  delivery_address: Joi.object({
    street: Joi.string().required(),
    number: Joi.string().required(),
    complement: Joi.string().optional(),
    neighborhood: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip_code: Joi.string().required(),
    country: Joi.string().required()
  }).required(),
  delivery_method: Joi.string().valid('delivery', 'pickup').required(),
  notes: Joi.string().optional()
});

// Schema para atualização de pedido
const updateOrderSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled').optional(),
  payment_status: Joi.string().valid('pending', 'paid', 'failed', 'refunded').optional(),
  estimated_delivery_time: Joi.string().isoDate().optional(),
  notes: Joi.string().optional()
});

// Schema para criação de pagamento
const createPaymentSchema = Joi.object({
  order_id: Joi.string().required(),
  amount: Joi.number().positive().required(),
  payment_method: Joi.string().valid('credit_card', 'debit_card', 'pix', 'cash', 'online').required(),
  gateway: Joi.string().required(),
  installments: Joi.number().integer().positive().optional(),
  card_brand: Joi.string().optional(),
  card_last_four: Joi.string().length(4).optional()
});

// Schema para reembolso
const refundSchema = Joi.object({
  amount: Joi.number().positive().required(),
  reason: Joi.string().required()
});

// Schema para cancelamento de pedido
const cancelOrderSchema = Joi.object({
  reason: Joi.string().required()
});

export const validateCreateOrder = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    
    logger.warn('Create order validation failed', {
      correlationId: req.correlationId,
      errors: errorMessages
    });

    res.status(400).json({
      success: false,
      message: 'Invalid order data',
      errors: errorMessages,
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  req.body = value;
  next();
};

export const validateUpdateOrder = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const { error, value } = updateOrderSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    
    logger.warn('Update order validation failed', {
      correlationId: req.correlationId,
      orderId: req.params['id'],
      errors: errorMessages
    });

    res.status(400).json({
      success: false,
      message: 'Invalid update data',
      errors: errorMessages,
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  req.body = value;
  next();
};

export const validateCreatePayment = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const { error, value } = createPaymentSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    
    logger.warn('Create payment validation failed', {
      correlationId: req.correlationId,
      errors: errorMessages
    });

    res.status(400).json({
      success: false,
      message: 'Invalid payment data',
      errors: errorMessages,
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  req.body = value;
  next();
};

export const validateRefund = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const { error, value } = refundSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    
    logger.warn('Refund validation failed', {
      correlationId: req.correlationId,
      paymentId: req.params['id'],
      errors: errorMessages
    });

    res.status(400).json({
      success: false,
      message: 'Invalid refund data',
      errors: errorMessages,
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  req.body = value;
  next();
};

export const validateCancelOrder = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const { error, value } = cancelOrderSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    
    logger.warn('Cancel order validation failed', {
      correlationId: req.correlationId,
      orderId: req.params['id'],
      errors: errorMessages
    });

    res.status(400).json({
      success: false,
      message: 'Invalid cancel data',
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

// Middleware genérico para validação de requests da API Playfood Payment Provider
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      const correlationId = req.headers['x-correlation-id'] as string || 'unknown';
      
      logger.warn('Request validation failed', {
        correlationId,
        path: req.path,
        method: req.method,
        errors: errorMessages
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errorMessages.map(msg => ({
            field: 'body',
            message: msg,
            code: 'INVALID_FIELD'
          }))
        },
        timestamp: new Date().toISOString(),
        correlationId
      });
      return;
    }

    req.body = value;
    next();
  };
}; 