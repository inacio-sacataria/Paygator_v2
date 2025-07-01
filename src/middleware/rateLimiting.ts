import rateLimit from 'express-rate-limit';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || config.rateLimit.windowMs,
    max: options.max || config.rateLimit.maxRequests,
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later.',
      timestamp: new Date().toISOString()
    },
    keyGenerator: options.keyGenerator || ((req) => {
      // Use API key if available, otherwise use IP
      const apiKey = req.headers['x-api-key'];
      if (typeof apiKey === 'string') {
        return apiKey;
      }
      return req.ip || 'unknown';
    }),
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        apiKey: req.headers['x-api-key'] ? 'present' : 'missing'
      });
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil(options.windowMs! / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/v1/health';
    }
  });
};

// Rate limiters específicos para diferentes endpoints
export const webhookRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por 15 minutos
  message: 'Too many webhook requests, please try again later.'
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por 15 minutos
  message: 'Too many API requests, please try again later.'
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de autenticação por 15 minutos
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: (req) => req.ip || 'unknown'
}); 