import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { loggingService } from '../services/loggingService.js';

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
  
  // Capturar o corpo da requisição para logging
  let requestBody: any = null;
  if (req.body && Object.keys(req.body).length > 0) {
    requestBody = { ...req.body };
    // Remover dados sensíveis
    if (requestBody.customer) {
      requestBody.customer = {
        ...requestBody.customer,
        phone: requestBody.customer.phone ? '[REDACTED]' : undefined
      };
    }
  }
  
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
    const contentLength = typeof data === 'string' ? data.length : JSON.stringify(data).length;
    
    logger.info('Outgoing response', {
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength
    });

    // Salvar log no banco de dados
    loggingService.logApiCall({
      correlationId: req.correlationId || 'unknown',
      method: req.method,
      url: req.url,
      ipAddress: req.ip || undefined,
      userAgent: req.get('User-Agent') || undefined,
      apiKey: req.headers['x-api-key'] as string || undefined,
      webhookSignature: req.headers['x-webhook-signature'] as string || undefined,
      requestHeaders: {
        'content-type': req.get('Content-Type'),
        'user-agent': req.get('User-Agent'),
        'x-api-key': req.headers['x-api-key'] ? '[PRESENT]' : '[MISSING]',
        'x-webhook-signature': req.headers['x-webhook-signature'] ? '[PRESENT]' : '[MISSING]'
      },
      requestBody,
      responseStatus: res.statusCode,
      responseBody: typeof data === 'string' ? data.substring(0, 1000) : JSON.stringify(data).substring(0, 1000),
      responseTimeMs: responseTime,
      contentLength,
      errorMessage: res.statusCode >= 400 ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined
    }).catch(error => {
      logger.error('Failed to save API log', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId 
      });
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