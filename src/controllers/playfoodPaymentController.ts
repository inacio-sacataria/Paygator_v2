import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { dataService } from '../services/dataService';
import {
  PlayfoodPaymentCreateRequest,
  PlayfoodPaymentCreateResponse,
  PlayfoodPaymentInfoRequest,
  PlayfoodPaymentInfoResponse,
  PlayfoodPaymentCaptureRequest,
  PlayfoodPaymentCaptureResponse,
  PlayfoodPaymentRefundRequest,
  PlayfoodPaymentRefundResponse,
  PlayfoodMerchantRegisterRequest,
  PlayfoodMerchantRegisterResponse,
  PlayfoodTransferCreateRequest,
  PlayfoodTransferCreateResponse,
  PlayfoodWebhookRequest,
  PlayfoodWebhookResponse,
  PlayfoodExternalPayment,
  PlayfoodCustomer,
  PlayfoodError,
  PlayfoodPaymentMethodData,
  PlayfoodCardData
} from '../types/playfoodPayment';

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
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestData: PlayfoodPaymentCreateRequest = req.body;
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    logger.info('Creating payment', {
      paymentId: requestData.paymentId,
      amount: requestData.amount,
      currency: requestData.currency,
      correlationId
    });

    // Simular processamento de pagamento
    const externalPaymentId = `ext_${uuidv4().replace(/-/g, '')}`;
    const paymentLink = `https://playfood-payment-gateway.com/pay/${externalPaymentId}`;

    const response: PlayfoodPaymentCreateResponse = {
      externalPayment: {
        id: externalPaymentId,
        data: {
          gateway: 'playfood',
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        }
      },
      responseType: 'IFRAME',
      link: paymentLink
    };

    logger.info('Payment created successfully', {
      paymentId: requestData.paymentId,
      externalPaymentId,
      correlationId
    });

    res.status(200).json({
      success: true,
      ...response,
      message: 'Payment created successfully',
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id'] as string || uuidv4()
    });
  } catch (error) {
    logger.error('Error creating payment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.headers['x-correlation-id'] as string
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_CREATION_ERROR',
        message: 'Failed to create payment'
      },
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id'] as string || uuidv4()
    });
  }
};

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
export const getPaymentInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestData: PlayfoodPaymentInfoRequest = req.body;
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    logger.info('Getting payment info', {
      paymentId: requestData.paymentId,
      externalPaymentId: requestData.externalPayment?.id || null,
      correlationId
    });

    // Buscar pagamento no banco e montar resposta real
    const payment = await dataService.getPaymentById(requestData.paymentId);
    if (!payment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        },
        timestamp: new Date().toISOString(),
        correlationId
      });
      return;
    }

    const metadata = (() => {
      try { return payment.metadata ? JSON.parse(payment.metadata) : {}; } catch { return {}; }
    })();

    const mapStatus = (dbStatus?: string): 'succeeded' | 'pending' | 'failed' | 'cancelled' => {
      switch ((dbStatus || '').toLowerCase()) {
        case 'completed': return 'succeeded';
        case 'failed': return 'failed';
        case 'cancelled': return 'cancelled';
        case 'processing':
        case 'pending':
        default: return 'pending';
      }
    };

    const status = mapStatus(payment.status);
    const amount = payment.amount || 0;
    const currency = payment.currency || 'MZN';

    const customer: PlayfoodCustomer = {
      email: metadata.customer_email || 'customer@example.com',
      phone: metadata.customer_phone || '',
      name: metadata.customer_name || 'Customer',
      billingAddress: {
        countryCode: metadata.billingAddress?.countryCode || '',
        stateCode: metadata.billingAddress?.stateCode || '',
        city: metadata.billingAddress?.city || '',
        postcode: metadata.billingAddress?.postcode || '',
        street1: metadata.billingAddress?.street1 || '',
        street2: metadata.billingAddress?.street2 || ''
      },
      external: {
        id: metadata.customer_external_id || 'customer_default',
        data: metadata.customer_external_data || null
      }
    };

    const response: PlayfoodPaymentInfoResponse = {
      paymentId: requestData.paymentId,
      status,
      amount,
      amountReceived: status === 'succeeded' ? amount : 0,
      amountCaptured: status === 'succeeded' ? amount : 0,
      amountRefunded: 0,
      currency,
      customer,
      externalPayment: requestData.externalPayment || {
        id: metadata.external_payment_id || requestData.paymentId,
        data: { status: payment.status }
      }
    };

    logger.info('Payment info retrieved successfully', {
      paymentId: requestData.paymentId,
      status: response.status,
      correlationId
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting payment info', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.headers['x-correlation-id'] as string
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_INFO_ERROR',
        message: 'Failed to get payment information'
      },
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id'] as string || uuidv4()
    });
  }
};

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
export const capturePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestData: PlayfoodPaymentCaptureRequest = req.body;
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    logger.info('Capturing payment', {
      paymentId: requestData.paymentId,
      amountToCapture: requestData.amountToCapture,
      correlationId
    });

    const response: PlayfoodPaymentCaptureResponse = {
      externalPayment: requestData.externalPayment,
      status: 'succeeded',
      amount: 100.50,
      amountCaptured: requestData.amountToCapture,
      amountRefunded: 0.00
    };

    logger.info('Payment captured successfully', {
      paymentId: requestData.paymentId,
      amountCaptured: requestData.amountToCapture,
      correlationId
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error capturing payment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.headers['x-correlation-id'] as string
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_CAPTURE_ERROR',
        message: 'Failed to capture payment'
      },
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id'] as string || uuidv4()
    });
  }
};

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
export const refundPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestData: PlayfoodPaymentRefundRequest = req.body;
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    logger.info('Refunding payment', {
      paymentId: requestData.paymentId,
      amountToRefund: requestData.amountToRefund,
      correlationId
    });

    const response: PlayfoodPaymentRefundResponse = {
      externalPayment: requestData.externalPayment,
      status: 'succeeded',
      amount: 100.50,
      amountCaptured: 100.50,
      amountRefunded: requestData.amountToRefund
    };

    logger.info('Payment refunded successfully', {
      paymentId: requestData.paymentId,
      amountRefunded: requestData.amountToRefund,
      correlationId
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error refunding payment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.headers['x-correlation-id'] as string
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_REFUND_ERROR',
        message: 'Failed to refund payment'
      },
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id'] as string || uuidv4()
    });
  }
};

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
export const registerMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestData: PlayfoodMerchantRegisterRequest = req.body;
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    logger.info('Registering merchant', {
      merchantId: requestData.id,
      businessType: requestData.businessType,
      correlationId
    });

    const externalId = `merch_${uuidv4().replace(/-/g, '')}`;

    const response: PlayfoodMerchantRegisterResponse = {
      externalId,
      merchantData: {
        status: 'active',
        createdAt: new Date().toISOString(),
        verificationStatus: 'pending',
        accountType: requestData.businessType
      }
    };

    logger.info('Merchant registered successfully', {
      merchantId: requestData.id,
      externalId,
      correlationId
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error registering merchant', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.headers['x-correlation-id'] as string
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'MERCHANT_REGISTRATION_ERROR',
        message: 'Failed to register merchant'
      },
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id'] as string || uuidv4()
    });
  }
};

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
export const createTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestData: PlayfoodTransferCreateRequest = req.body;
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    logger.info('Creating transfer', {
      paymentId: requestData.paymentId,
      merchantId: requestData.merchant.id,
      amount: requestData.amount,
      correlationId
    });

    const transferId = `transf_${uuidv4().replace(/-/g, '')}`;
    const fee = 2.50;
    const total = requestData.amount + fee;
    const net = requestData.amount - fee;

    const response: PlayfoodTransferCreateResponse = {
      id: transferId,
      fee: {
        amount: fee,
        currency: 'USD',
        type: 'processing_fee'
      },
      total,
      net,
      details: {
        status: 'pending',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
        method: 'bank_transfer'
      }
    };

    logger.info('Transfer created successfully', {
      transferId,
      amount: requestData.amount,
      correlationId
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error creating transfer', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.headers['x-correlation-id'] as string
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSFER_CREATION_ERROR',
        message: 'Failed to create transfer'
      },
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id'] as string || uuidv4()
    });
  }
};

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
export const processWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const paymentSettingsId = req.params['paymentSettingsId'];
    const requestData: PlayfoodWebhookRequest = req.body;
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    logger.info('Processing webhook', {
      paymentSettingsId,
      externalPaymentId: requestData.externalPaymentId,
      eventAction: requestData.eventAction,
      webhookEventId: requestData.webhookEventId,
      correlationId
    });

    // Simular processamento do webhook
    const response: PlayfoodWebhookResponse = {
      status: 'received',
      message: 'Webhook processed successfully'
    };

    logger.info('Webhook processed successfully', {
      paymentSettingsId,
      externalPaymentId: requestData.externalPaymentId,
      eventAction: requestData.eventAction,
      correlationId
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error processing webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.headers['x-correlation-id'] as string
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBHOOK_PROCESSING_ERROR',
        message: 'Failed to process webhook'
      },
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id'] as string || uuidv4()
    });
  }
}; 