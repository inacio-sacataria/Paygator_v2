import { Request, Response } from 'express';
import { CreatePaymentRequest, CreatePaymentResponse } from '../types/payment';
import { logger } from '../utils/logger.js';
import { loggingService } from '../services/loggingService.js';
import { AuthenticatedRequest } from '../middleware/logging.js';
import { supabaseService } from '../config/database.js';

export class PaymentController {
  public createPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const paymentData: CreatePaymentRequest = req.body;

      // Validar apenas o campo obrigatório (amount)
      if (!paymentData.amount) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Missing required field: amount',
          errors: ['amount is required'],
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Fornecer valores padrão para campos opcionais
      const paymentDataWithDefaults = {
        paymentId: paymentData.paymentId || `pay_${Date.now()}`,
        externalPaymentId: paymentData.externalPaymentId || Math.floor(Math.random() * 1000000),
        paymentMethod: paymentData.paymentMethod || 'credit_card',
        paymentMethodId: paymentData.paymentMethodId || null,
        amount: paymentData.amount,
        currency: paymentData.currency || 'BRL',
        customer: paymentData.customer || {
          email: 'default@example.com',
          phone: '+5511999999999',
          name: 'Default Customer',
          billingAddress: {
            countryCode: 'BR',
            stateCode: 'SP',
            city: 'São Paulo',
            postcode: '01000-000',
            street1: 'Rua Exemplo, 123',
            street2: ''
          },
          external: {
            id: 'default_customer',
            data: null
          }
        },
        locale: paymentData.locale || 'pt-BR',
        returnUrl: paymentData.returnUrl || 'https://example.com/success',
        orderDetails: paymentData.orderDetails || {
          orderId: `order_${Date.now()}`,
          public: {
            vendorId: 'default_vendor',
            vendorName: 'Default Vendor',
            cartTotal: paymentData.amount,
            deliveryTotal: 0,
            taxTotal: 0,
            serviceFeeTotal: 0,
            discountTotal: 0
          },
          internal: {
            vendorMerchant: {
              id: 'default_merchant',
              externalId: null,
              businessType: 'INDIVIDUAL',
              taxId: '12345678901',
              name: 'Default Merchant',
              address: {
                addressLine: 'Rua Comercial, 456',
                city: 'São Paulo',
                countryCode: 'BR',
                zip: '01234-567'
              },
              phone: '+5511888888888',
              email: 'merchant@example.com',
              active: true,
              data: {
                companyData: null,
                merchantData: null
              }
            },
            vendorShare: 100
          }
                 }
       };

       logger.info('Creating payment', {
         correlationId: req.correlationId,
         paymentId: paymentDataWithDefaults.paymentId,
         externalPaymentId: paymentDataWithDefaults.externalPaymentId,
         amount: paymentDataWithDefaults.amount,
         currency: paymentDataWithDefaults.currency,
         orderId: paymentDataWithDefaults.orderDetails.orderId
       });

       // Simular processamento do pagamento
      const externalPaymentId = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Gerar link do iframe (simulado)
      const iframeLink = `https://payment-gateway.com/pay/${externalPaymentId}?amount=${paymentDataWithDefaults.amount}&currency=${paymentDataWithDefaults.currency}`;

      // Salvar pagamento no Supabase
      const paymentRecord = {
        payment_id: paymentDataWithDefaults.paymentId,
        external_payment_id: externalPaymentId,
        amount: paymentDataWithDefaults.amount,
        currency: paymentDataWithDefaults.currency,
        payment_method: paymentDataWithDefaults.paymentMethod,
        customer_email: paymentDataWithDefaults.customer.email,
        customer_name: paymentDataWithDefaults.customer.name,
        customer_phone: paymentDataWithDefaults.customer.phone,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_id: paymentDataWithDefaults.orderDetails.orderId,
        return_url: paymentDataWithDefaults.returnUrl,
        iframe_link: iframeLink
      };

      const dbResult = await supabaseService.createPayment(paymentRecord);
      
      if (!dbResult.success) {
        logger.warn('Failed to save payment to database, but continuing with response', {
          correlationId: req.correlationId,
          error: dbResult.error
        });
      } else {
        // Log do pagamento criado
        await loggingService.logPayment({
          paymentId: paymentDataWithDefaults.paymentId,
          externalPaymentId: externalPaymentId,
          action: 'created',
          newStatus: 'pending',
          amount: paymentDataWithDefaults.amount,
          currency: paymentDataWithDefaults.currency,
          customerEmail: paymentDataWithDefaults.customer.email,
          correlationId: req.correlationId || 'unknown'
        });
      }

      const response: CreatePaymentResponse = {
        externalPayment: {
          id: externalPaymentId,
          data: {
            status: 'pending',
            created_at: new Date().toISOString(),
            payment_method: paymentDataWithDefaults.paymentMethod,
            amount: paymentDataWithDefaults.amount,
            currency: paymentDataWithDefaults.currency
          }
        },
        responseType: 'IFRAME',
        link: iframeLink
      };

      logger.info('Payment created successfully', {
        correlationId: req.correlationId,
        paymentId: paymentDataWithDefaults.paymentId,
        externalPaymentId: externalPaymentId,
        responseType: response.responseType
      });

      res.status(201).json({
        success: true,
        data: response,
        message: 'Payment created successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error creating payment', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to create payment',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public getPaymentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Payment ID is required',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      logger.info('Getting payment status', {
        correlationId: req.correlationId,
        paymentId: paymentId
      });

      // Buscar pagamento no Supabase
      const dbResult = await supabaseService.getPayment(paymentId);
      
      if (!dbResult.success) {
        logger.warn('Payment not found in database', {
          correlationId: req.correlationId,
          paymentId: paymentId,
          error: dbResult.error
        });
        
        res.status(404).json({
          success: false,
          data: null,
          message: 'Payment not found',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const paymentStatus = {
        paymentId: dbResult.data.payment_id,
        status: dbResult.data.status,
        amount: dbResult.data.amount,
        currency: dbResult.data.currency,
        created_at: dbResult.data.created_at,
        updated_at: dbResult.data.updated_at,
        customer_email: dbResult.data.customer_email,
        customer_name: dbResult.data.customer_name,
        iframe_link: dbResult.data.iframe_link
      };

      res.status(200).json({
        success: true,
        data: paymentStatus,
        message: 'Payment status retrieved successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error getting payment status', {
        correlationId: req.correlationId,
        paymentId: req.params['paymentId'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to get payment status',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };
} 