import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { authenticateApiKey } from '../middleware/authentication';
import { validateWebhookSignature } from '../middleware/signatureValidation';
import { webhookRateLimiter, apiRateLimiter } from '../middleware/rateLimiting';
import { validateWebhookPayload } from '../middleware/validation';

const router = Router();
const webhookController = new WebhookController();

// Webhook de pagamento (não requer autenticação por API key, apenas validação de assinatura)
router.post(
  '/payment',
  webhookRateLimiter,
  validateWebhookSignature,
  validateWebhookPayload,
  webhookController.processWebhook
);

// Configuração de webhooks (requer autenticação)
router.post(
  '/configure',
  apiRateLimiter,
  authenticateApiKey,
  webhookController.createWebhookConfig
);

router.get(
  '/list',
  apiRateLimiter,
  authenticateApiKey,
  webhookController.listWebhookConfigs
);

router.put(
  '/:id',
  apiRateLimiter,
  authenticateApiKey,
  webhookController.updateWebhookConfig
);

router.delete(
  '/:id',
  apiRateLimiter,
  authenticateApiKey,
  webhookController.deleteWebhookConfig
);

// Status e monitoramento
router.get(
  '/status',
  apiRateLimiter,
  authenticateApiKey,
  webhookController.getWebhookStatus
);

router.get(
  '/logs',
  apiRateLimiter,
  authenticateApiKey,
  webhookController.getWebhookLogs
);

export default router; 