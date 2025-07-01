import { Router } from 'express';
import { PlayfoodController } from '../controllers/playfoodController';
import { authenticateApiKey } from '../middleware/authentication';
import { validatePlayfoodSignature } from '../middleware/playfoodSignatureValidation';
import { apiRateLimiter, webhookRateLimiter } from '../middleware/rateLimiting';
import { 
  validateCreateOrder, 
  validateUpdateOrder, 
  validateCreatePayment,
  validatePagination 
} from '../middleware/playfoodValidation';

const router = Router();
const playfoodController = new PlayfoodController();

// Orders endpoints
router.post(
  '/orders',
  apiRateLimiter,
  authenticateApiKey,
  validateCreateOrder,
  playfoodController.createOrder
);

router.get(
  '/orders',
  apiRateLimiter,
  authenticateApiKey,
  validatePagination,
  playfoodController.listOrders
);

router.get(
  '/orders/:id',
  apiRateLimiter,
  authenticateApiKey,
  playfoodController.getOrder
);

router.put(
  '/orders/:id',
  apiRateLimiter,
  authenticateApiKey,
  validateUpdateOrder,
  playfoodController.updateOrder
);

router.post(
  '/orders/:id/cancel',
  apiRateLimiter,
  authenticateApiKey,
  playfoodController.cancelOrder
);

// Payments endpoints
router.post(
  '/payments',
  apiRateLimiter,
  authenticateApiKey,
  validateCreatePayment,
  playfoodController.createPayment
);

router.get(
  '/payments',
  apiRateLimiter,
  authenticateApiKey,
  validatePagination,
  playfoodController.listPayments
);

router.get(
  '/payments/:id',
  apiRateLimiter,
  authenticateApiKey,
  playfoodController.getPayment
);

router.post(
  '/payments/:id/refund',
  apiRateLimiter,
  authenticateApiKey,
  playfoodController.refundPayment
);

// Webhook endpoint (não requer autenticação por API key, apenas validação de assinatura)
router.post(
  '/webhooks',
  webhookRateLimiter,
  validatePlayfoodSignature,
  playfoodController.handleWebhook
);

// Status endpoint
router.get(
  '/status',
  apiRateLimiter,
  authenticateApiKey,
  playfoodController.getStatus
);

export default router; 