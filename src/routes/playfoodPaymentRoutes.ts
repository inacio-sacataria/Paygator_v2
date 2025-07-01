import { Router } from 'express';
import {
  createPayment,
  getPaymentInfo,
  capturePayment,
  refundPayment,
  registerMerchant,
  createTransfer,
  processWebhook
} from '../controllers/playfoodPaymentController';
import { validateRequest } from '../middleware/playfoodValidation';
import { authenticateApiKey } from '../middleware/authentication';
import {
  createPaymentSchema,
  paymentInfoSchema,
  paymentCaptureSchema,
  paymentRefundSchema,
  merchantRegisterSchema,
  transferCreateSchema,
  webhookSchema,
  paymentSettingsIdSchema
} from '../models/playfoodValidationSchemas';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Playfood Payments
 *   description: Playfood Payment Provider API endpoints
 */

/**
 * @swagger
 * /payments/create:
 *   post:
 *     summary: Create a new payment
 *     description: Creates a new payment with the provided details
 *     tags: [Playfood Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - amount
 *               - currency
 *               - customer
 *               - locale
 *               - returnUrl
 *               - orderDetails
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Unique payment identifier
 *               externalPaymentId:
 *                 type: string
 *                 nullable: true
 *                 description: External payment identifier
 *               paymentMethod:
 *                 type: string
 *                 nullable: true
 *                 description: Payment method
 *               paymentMethodId:
 *                 type: string
 *                 nullable: true
 *                 description: Payment method identifier
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 pattern: '^[A-Z]{3}$'
 *                 description: Currency code (ISO 4217)
 *               customer:
 *                 type: object
 *                 description: Customer information
 *               locale:
 *                 type: string
 *                 pattern: '^[a-z]{2}(-[A-Z]{2})?$'
 *                 description: Locale code
 *               returnUrl:
 *                 type: string
 *                 format: uri
 *                 description: Return URL after payment
 *               orderDetails:
 *                 type: object
 *                 description: Order details
 *     responses:
 *       200:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 externalPayment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     data:
 *                       type: object
 *                 responseType:
 *                   type: string
 *                   enum: [IFRAME]
 *                 link:
 *                   type: string
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post('/create', authenticateApiKey, validateRequest(createPaymentSchema), createPayment);

/**
 * @swagger
 * /payments/info:
 *   post:
 *     summary: Get payment information
 *     description: Retrieves detailed information about a payment
 *     tags: [Playfood Payments]
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
 *                 description: Payment identifier
 *               externalPayment:
 *                 type: object
 *                 description: External payment information
 *     responses:
 *       200:
 *         description: Payment information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [succeeded, pending, failed, cancelled]
 *                 amount:
 *                   type: number
 *                 amountReceived:
 *                   type: number
 *                 amountCaptured:
 *                   type: number
 *                 amountRefunded:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 customer:
 *                   type: object
 *                 paymentMethodData:
 *                   type: object
 *                 externalPayment:
 *                   type: object
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/info', validateRequest(paymentInfoSchema), getPaymentInfo);

/**
 * @swagger
 * /payments/capture:
 *   post:
 *     summary: Capture a payment
 *     description: Captures a previously authorized payment
 *     tags: [Playfood Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - externalPayment
 *               - amountToCapture
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment identifier
 *               externalPayment:
 *                 type: object
 *                 description: External payment information
 *               amountToCapture:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Amount to capture
 *     responses:
 *       200:
 *         description: Payment captured successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 externalPayment:
 *                   type: object
 *                 status:
 *                   type: string
 *                   enum: [succeeded, pending, failed]
 *                 amount:
 *                   type: number
 *                 amountCaptured:
 *                   type: number
 *                 amountRefunded:
 *                   type: number
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/capture', validateRequest(paymentCaptureSchema), capturePayment);

/**
 * @swagger
 * /payments/refund:
 *   post:
 *     summary: Refund a payment
 *     description: Refunds a previously captured payment
 *     tags: [Playfood Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - externalPayment
 *               - amountToRefund
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment identifier
 *               externalPayment:
 *                 type: object
 *                 description: External payment information
 *               amountToRefund:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Amount to refund
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 externalPayment:
 *                   type: object
 *                 status:
 *                   type: string
 *                   enum: [succeeded, pending, failed]
 *                 amount:
 *                   type: number
 *                 amountCaptured:
 *                   type: number
 *                 amountRefunded:
 *                   type: number
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/refund', validateRequest(paymentRefundSchema), refundPayment);

/**
 * @swagger
 * /merchants/register:
 *   post:
 *     summary: Register a new merchant
 *     description: Registers a new merchant account
 *     tags: [Playfood Merchants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - businessType
 *               - taxId
 *               - name
 *               - address
 *               - phone
 *               - email
 *               - active
 *             properties:
 *               id:
 *                 type: string
 *                 description: Merchant identifier
 *               externalId:
 *                 type: string
 *                 nullable: true
 *                 description: External merchant identifier
 *               businessType:
 *                 type: string
 *                 enum: [INDIVIDUAL]
 *                 description: Business type
 *               taxId:
 *                 type: string
 *                 description: Tax identification number
 *               name:
 *                 type: string
 *                 description: Merchant name
 *               address:
 *                 type: object
 *                 description: Merchant address
 *               phone:
 *                 type: string
 *                 description: Phone number
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               active:
 *                 type: boolean
 *                 description: Whether the merchant is active
 *               companyData:
 *                 type: object
 *                 nullable: true
 *                 description: Additional company data
 *     responses:
 *       200:
 *         description: Merchant registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 externalId:
 *                   type: string
 *                 merchantData:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post('/merchants/register', validateRequest(merchantRegisterSchema), registerMerchant);

/**
 * @swagger
 * /transfers/create:
 *   post:
 *     summary: Create a transfer
 *     description: Creates a transfer to a merchant
 *     tags: [Playfood Transfers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - externalPayment
 *               - merchant
 *               - amount
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment identifier
 *               externalPayment:
 *                 type: object
 *                 description: External payment information
 *               merchant:
 *                 type: object
 *                 description: Merchant information
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Transfer amount
 *     responses:
 *       200:
 *         description: Transfer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 fee:
 *                   type: object
 *                 total:
 *                   type: number
 *                 net:
 *                   type: number
 *                 details:
 *                   type: object
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post('/transfers/create', validateRequest(transferCreateSchema), createTransfer);

/**
 * @swagger
 * /service/payments/webhook/v2/{paymentSettingsId}:
 *   post:
 *     summary: Process webhook
 *     description: Processes webhook events from payment providers
 *     tags: [Playfood Webhooks]
 *     parameters:
 *       - in: path
 *         name: paymentSettingsId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment settings identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - externalPaymentId
 *               - webhookEventId
 *               - eventAction
 *               - created
 *               - type
 *               - data
 *             properties:
 *               externalPaymentId:
 *                 type: string
 *                 description: External payment identifier
 *               webhookEventId:
 *                 type: string
 *                 format: uuid
 *                 description: Webhook event identifier
 *               eventAction:
 *                 type: string
 *                 enum: [PAYMENT_AUTHORIZED, PAYMENT_CAPTURED, PAYMENT_FAILED, PAYMENT_REFUNDED, PAYMENT_CANCELLED]
 *                 description: Event action type
 *               created:
 *                 type: string
 *                 format: date-time
 *                 description: Event creation timestamp
 *               type:
 *                 type: string
 *                 enum: [WEBHOOK]
 *                 description: Event type
 *               data:
 *                 type: object
 *                 description: Event data
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [received]
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post('/service/payments/webhook/v2/:paymentSettingsId', validateRequest(webhookSchema), processWebhook);

export default router;