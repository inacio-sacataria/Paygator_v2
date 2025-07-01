import { Router, Request, Response, NextFunction } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticateApiKey } from '../middleware/authentication';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/logging';

const router = Router();
const paymentController = new PaymentController();

// Schema de validação para criar pagamento
const createPaymentSchema = Joi.object({
  paymentId: Joi.string().required(),
  externalPaymentId: Joi.number().required(),
  paymentMethod: Joi.string().allow(null),
  paymentMethodId: Joi.string().allow(null),
  amount: Joi.number().positive().required(),
  currency: Joi.string().required(),
  customer: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    name: Joi.string().required(),
    billingAddress: Joi.object({
      countryCode: Joi.string().required(),
      stateCode: Joi.string().required(),
      city: Joi.string().required(),
      postcode: Joi.string().required(),
      street1: Joi.string().required(),
      street2: Joi.string().allow('')
    }).required(),
    external: Joi.object({
      id: Joi.string().required(),
      data: Joi.any()
    }).required()
  }).required(),
  locale: Joi.string().required(),
  returnUrl: Joi.string().uri().required(),
  orderDetails: Joi.object({
    orderId: Joi.string().required(),
    public: Joi.object({
      vendorId: Joi.string().required(),
      vendorName: Joi.string().required(),
      cartTotal: Joi.number().required(),
      deliveryTotal: Joi.number().required(),
      taxTotal: Joi.number().required(),
      serviceFeeTotal: Joi.number().required(),
      discountTotal: Joi.number().allow(null)
    }).required(),
    internal: Joi.object({
      vendorMerchant: Joi.object({
        id: Joi.string().required(),
        externalId: Joi.string().allow(null),
        businessType: Joi.string().valid('INDIVIDUAL', 'COMPANY').required(),
        taxId: Joi.string().required(),
        name: Joi.string().required(),
        address: Joi.object({
          addressLine: Joi.string().required(),
          city: Joi.string().required(),
          countryCode: Joi.string().allow(null),
          zip: Joi.string().required()
        }).required(),
        phone: Joi.string().required(),
        email: Joi.string().email().required(),
        active: Joi.boolean().required(),
        data: Joi.object({
          companyData: Joi.any(),
          merchantData: Joi.any()
        }).required()
      }).required(),
      vendorShare: Joi.number().required()
    }).required()
  }).required()
});

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

export default router; 