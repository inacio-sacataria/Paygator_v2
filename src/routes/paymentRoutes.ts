import { Router, Request, Response, NextFunction } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { MpesaController } from '../controllers/mpesaController';
import { EmolaController } from '../controllers/emolaController';
import { getPaymentInfo } from '../controllers/playfoodPaymentController';
import { authenticateApiKey } from '../middleware/authentication';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/logging';
import { sqliteService } from '../services/sqliteService';
import { paymentInfoSchema } from '../models/playfoodValidationSchemas';

const router = Router();
const paymentController = new PaymentController();
const mpesaController = new MpesaController();
const emolaController = new EmolaController();

// Middleware de debug para todas as rotas de pagamento
router.use((req, res, next) => {
  console.log('[PAYMENT ROUTES] Request received', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl
  });
  next();
});

// Schema de validação para criar pagamento - apenas amount é obrigatório
const createPaymentSchema = Joi.object({
  paymentId: Joi.string().optional(),
  externalPaymentId: Joi.number().optional(),
  paymentMethod: Joi.string().optional().allow(null),
  paymentMethodId: Joi.string().optional().allow(null),
  amount: Joi.number().positive().required(),
  currency: Joi.string().optional(),
  customer: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    name: Joi.string().optional(),
    billingAddress: Joi.object({
      countryCode: Joi.string().optional().allow('', null),
      stateCode: Joi.string().optional().allow('', null),
      city: Joi.string().optional().allow('', null),
      postcode: Joi.string().optional().allow('', null),
      street1: Joi.string().optional().allow('', null),
      street2: Joi.string().optional().allow('', null)
    }).unknown(true).optional(), // Allow unknown fields in billingAddress
    external: Joi.object({
      id: Joi.string().optional(),
      data: Joi.any().optional()
    }).unknown(true).optional() // Allow unknown fields in external
  }).unknown(true).optional(), // Allow unknown fields in customer
  locale: Joi.string().optional(),
  returnUrl: Joi.string().uri().optional(),
  orderDetails: Joi.object({
    orderId: Joi.string().optional(),
    items: Joi.array().items(Joi.object().unknown(true)).optional(), // Allow items array with any structure
    public: Joi.object({
      vendorId: Joi.string().optional(),
      vendorName: Joi.string().optional(),
      cartTotal: Joi.number().optional(),
      deliveryTotal: Joi.number().optional(),
      taxTotal: Joi.number().optional(),
      serviceFeeTotal: Joi.number().optional(),
      discountTotal: Joi.number().optional().allow(null)
    }).unknown(true).optional(), // Allow unknown fields in public
    internal: Joi.object({
      vendorMerchant: Joi.object({
        id: Joi.string().optional(),
        externalId: Joi.any().optional(),
        businessType: Joi.string().valid('INDIVIDUAL', 'COMPANY').optional(),
        taxId: Joi.any().optional(),
        name: Joi.string().optional(),
        address: Joi.object({
          addressLine: Joi.string().optional(),
          city: Joi.string().optional(),
          countryCode: Joi.string().optional().allow(null),
          zip: Joi.string().optional()
        }).unknown(true).optional(), // Allow unknown fields in address
        phone: Joi.string().optional(),
        email: Joi.string().email().optional(),
        active: Joi.boolean().optional(),
        data: Joi.object({
          companyData: Joi.any().optional(),
          merchantData: Joi.any().optional()
        }).unknown(true).optional() // Allow unknown fields in data
      }).unknown(true).optional(), // Allow unknown fields in vendorMerchant
      vendorShare: Joi.number().optional()
    }).unknown(true).optional() // Allow unknown fields in internal
  }).unknown(true).optional() // Allow unknown fields in orderDetails
}).unknown(true); // Allow unknown fields at root level

// Middleware de validação genérico
const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      
      logger.warn('Request validation failed', {
        correlationId: (req as AuthenticatedRequest).correlationId,
        errors: errorMessages,
        payload: req.body
      });

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
        timestamp: new Date().toISOString(),
        correlation_id: (req as AuthenticatedRequest).correlationId || 'unknown'
      });
      return;
    }

    req.body = value;
    next();
  };
};

/**
 * @swagger
 * /api/v1/payments/create:
 *   post:
 *     summary: Create a new payment
 *     description: Creates a new payment and returns iframe link for payment processing
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - externalPaymentId
 *               - amount
 *               - currency
 *               - customer
 *               - locale
 *               - returnUrl
 *               - orderDetails
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Internal payment ID
 *               externalPaymentId:
 *                 type: number
 *                 description: External payment ID
 *               paymentMethod:
 *                 type: string
 *                 nullable: true
 *                 description: Payment method
 *               paymentMethodId:
 *                 type: string
 *                 nullable: true
 *                 description: Payment method ID
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 description: Payment currency
 *               customer:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *                   name:
 *                     type: string
 *                   billingAddress:
 *                     type: object
 *                   external:
 *                     type: object
 *               locale:
 *                 type: string
 *                 description: Locale for payment
 *               returnUrl:
 *                 type: string
 *                 format: uri
 *                 description: Return URL after payment
 *               orderDetails:
 *                 type: object
 *                 properties:
 *                   orderId:
 *                     type: string
 *                   public:
 *                     type: object
 *                   internal:
 *                     type: object
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     externalPayment:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         data:
 *                           type: object
 *                     responseType:
 *                       type: string
 *                       enum: [IFRAME, REDIRECT, API]
 *                     link:
 *                       type: string
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid API key
 *       500:
 *         description: Internal server error
 */
router.post('/create', 
  authenticateApiKey,
  validateRequest(createPaymentSchema),
  paymentController.createPayment
);

/**
 * @swagger
 * /api/v1/payments/info:
 *   post:
 *     summary: Get payment information
 *     description: Returns detailed payment info for a given paymentId and externalPayment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - externalPayment
 *             properties:
 *               paymentId:
 *                 type: string
 *               externalPayment:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   data:
 *                     type: object
 *     responses:
 *       200:
 *         description: Payment information retrieved successfully
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post('/info',
  validateRequest(paymentInfoSchema),
  getPaymentInfo
);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/status:
 *   get:
 *     summary: Get payment status
 *     description: Retrieves the status of a payment
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       401:
 *         description: Unauthorized - invalid API key
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:paymentId/status',
  authenticateApiKey,
  paymentController.getPaymentStatus
);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/public-status:
 *   get:
 *     summary: Get payment status (Public)
 *     description: Retrieves the current status of a payment (no authentication required)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       400:
 *         description: Bad request - missing payment ID
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:paymentId/public-status',
  paymentController.getPaymentStatus
);

/**
 * @swagger
 * /api/v1/payments/process-mpesa:
 *   post:
 *     summary: Process M-Pesa payment
 *     description: Processes a payment using M-Pesa mobile money
 *     tags: [Payments, M-Pesa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - phone
 *               - amount
 *               - currency
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment ID
 *               phone:
 *                 type: string
 *                 description: Phone number in format +258XXXXXXXXX
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 description: Payment currency
 *     responses:
 *       200:
 *         description: M-Pesa payment processed successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/process-mpesa',
  mpesaController.processMpesaPayment
);

/**
 * @swagger
 * /api/v1/payments/mpesa-callback:
 *   post:
 *     summary: M-Pesa callback
 *     description: Receives callback from M-Pesa payment system
 *     tags: [Payments, M-Pesa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - status
 *               - transactionId
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment ID
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *                 description: Payment status from M-Pesa
 *               transactionId:
 *                 type: string
 *                 description: M-Pesa transaction ID
 *     responses:
 *       200:
 *         description: Callback processed successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/mpesa-callback',
  mpesaController.simulateMpesaCallback
);

/**
 * @swagger
 * /api/v1/payments/process-emola:
 *   post:
 *     summary: Process e-Mola payment
 *     description: Processes a payment using e-Mola mobile money
 *     tags: [Payments, e-Mola]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - phone
 *               - amount
 *               - currency
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment ID
 *               phone:
 *                 type: string
 *                 description: Phone number in format +258XXXXXXXXX
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 description: Payment currency
 *     responses:
 *       200:
 *         description: e-Mola payment processed successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/process-emola',
  (req, res, next) => {
    console.log('[ROUTE] /process-emola called', {
      method: req.method,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl
    });
    next();
  },
  emolaController.processEmolaPayment
);

/**
 * @swagger
 * /api/v1/payments/emola-callback:
 *   post:
 *     summary: e-Mola callback
 *     description: Receives callback from e-Mola payment system
 *     tags: [Payments, e-Mola]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - status
 *               - transactionId
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment ID
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *                 description: Payment status from e-Mola
 *               transactionId:
 *                 type: string
 *                 description: e-Mola transaction ID
 *     responses:
 *       200:
 *         description: Callback processed successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/emola-callback',
  emolaController.simulateEmolaCallback
);

/**
 * @swagger
 * /api/v1/payments/process-emola-b2c:
 *   post:
 *     summary: Process e-Mola B2C payment
 *     description: Processes a B2C (Business to Customer) payment using e-Mola mobile money. B2C is used to send money from business to customer.
 *     tags: [Payments, e-Mola, B2C]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - phone
 *               - amount
 *               - currency
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment ID
 *               phone:
 *                 type: string
 *                 description: Phone number in format +258XXXXXXXXX
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 description: Payment currency
 *     responses:
 *       200:
 *         description: e-Mola B2C payment processed successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/process-emola-b2c',
  emolaController.processEmolaB2CPayment
);

/**
 * @swagger
 * /api/v1/payments/emola-b2c-callback:
 *   post:
 *     summary: e-Mola B2C callback
 *     description: Receives callback from e-Mola B2C payment system
 *     tags: [Payments, e-Mola, B2C]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - status
 *               - transactionId
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment ID
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *                 description: Payment status from e-Mola
 *               transactionId:
 *                 type: string
 *                 description: e-Mola transaction ID
 *     responses:
 *       200:
 *         description: Callback processed successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/emola-b2c-callback',
  emolaController.simulateEmolaB2CCallback
);

/**
 * @swagger
 * /api/v1/payments/process-vendor-b2c:
 *   post:
 *     summary: Process vendor B2C payment
 *     description: Processes a B2C payment to vendor after C2B payment is completed. Calculates system commission and sends net amount to vendor.
 *     tags: [Payments, e-Mola, B2C, Vendor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment ID of completed C2B payment
 *               commissionPercentage:
 *                 type: number
 *                 description: System commission percentage (0-100). If not provided, uses vendorShare from payment metadata
 *               vendorPhone:
 *                 type: string
 *                 description: Vendor phone number (optional if configured in vendorMerchant)
 *     responses:
 *       200:
 *         description: Vendor B2C payment processed successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/process-vendor-b2c',
  emolaController.processVendorB2CPayment
);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/confirm:
 *   post:
 *     summary: Manually confirm payment
 *     description: Manually confirms a payment for testing purposes
 *     tags: [Payments, Testing]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID to confirm
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/:paymentId/confirm', async (req: Request, res: Response) => {
  try {
    const paymentId = req.params['paymentId'] as string;
    if (!paymentId) {
      res.status(400).json({
        success: false,
        message: 'Parâmetro paymentId é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Buscar pagamento no banco
    const existingPayment = await sqliteService.getPaymentById(paymentId);
    
    if (!existingPayment) {
      res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Atualizar status para completed
    await sqliteService.updatePayment(paymentId, {
      status: 'completed',
      metadata: JSON.stringify({
        ...JSON.parse(existingPayment.metadata || '{}'),
        manuallyConfirmed: true,
        confirmedAt: new Date().toISOString()
      })
    });

    res.status(200).json({
      success: true,
      message: 'Pagamento confirmado manualmente com sucesso',
      data: {
        paymentId,
        status: 'completed',
        confirmedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno ao confirmar pagamento',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 