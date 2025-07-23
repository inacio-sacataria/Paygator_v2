import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  correlationId?: string;
}

export const authenticateApiKey = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    logger.warn('API key missing', { 
      correlationId: req.correlationId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(401).json({
      success: false,
      message: 'API key is required',
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  // Validate against multiple API keys
  const isValidApiKey = config.security.apiKeys.includes(apiKey);
  
  if (!isValidApiKey) {
    logger.warn('Invalid API key', { 
      correlationId: req.correlationId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      providedKey: apiKey.substring(0, 10) + '...' // Log partial key for debugging
    });
    res.status(401).json({
      success: false,
      message: 'Invalid API key',
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId || 'unknown'
    });
    return;
  }

  req.apiKey = apiKey;
  next();
};

export const optionalApiKey = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey) {
    if (config.security.apiKeys.includes(apiKey)) {
      req.apiKey = apiKey;
    } else {
      logger.warn('Invalid optional API key', { 
        correlationId: req.correlationId,
        ip: req.ip,
        providedKey: apiKey.substring(0, 10) + '...'
      });
    }
  }
  
  next();
}; 