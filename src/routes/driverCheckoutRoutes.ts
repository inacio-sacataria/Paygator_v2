import { Router } from 'express';
import Joi from 'joi';
import { authenticateApiKey } from '../middleware/authentication';
import { DriverCheckoutController } from '../controllers/driverCheckoutController';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/logging';

const router = Router();
const controller = new DriverCheckoutController();

const checkoutSchema = Joi.object({
  phone: Joi.string().required(),
  amount: Joi.number().positive().required(),
  provider: Joi.string().valid('mpesa', 'emola').required(),
});

const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn('Driver checkout validation failed', {
        correlationId: (req as AuthenticatedRequest).correlationId,
        errors: error.details.map((detail) => detail.message),
      });
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((detail) => detail.message),
        timestamp: new Date().toISOString(),
        correlation_id: (req as AuthenticatedRequest).correlationId || 'unknown',
      });
      return;
    }
    req.body = value;
    next();
  };
};

router.post('/topup', authenticateApiKey, validateRequest(checkoutSchema), controller.createTopUpCheckout);
router.get('/:paymentId/status', authenticateApiKey, controller.getCheckoutStatus);
router.post('/:paymentId/commit', authenticateApiKey, controller.retryCommit);

// Public endpoints for browser-based driver checkout
router.post('/public/topup', validateRequest(checkoutSchema), controller.createTopUpCheckout);
router.get('/public/:paymentId/status', controller.getCheckoutStatus);

export default router;
