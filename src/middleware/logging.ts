import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  correlationId?: string;
  webhookPayload?: any;
  startTime?: number;
}

export const correlationIdMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};

export const requestLoggingMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  req.startTime = Date.now();
  
  logger.info('Incoming request', {
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    apiKey: req.headers['x-api-key'] ? 'present' : 'missing',
    webhookSignature: req.headers['x-webhook-signature'] ? 'present' : 'missing'
  });

  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - (req.startTime || 0);
    
    logger.info('Outgoing response', {
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: data?.length || 0
    });

    return originalSend.call(this, data);
  };

  next();
};

export const errorLoggingMiddleware = (error: Error, req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  logger.error('Unhandled error', {
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    }
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    correlation_id: req.correlationId || 'unknown'
  });
}; 