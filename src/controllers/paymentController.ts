import { Request, Response } from 'express';
import { CreatePaymentRequest, CreatePaymentResponse } from '../types/payment';
import { logger } from '../utils/logger';
import { loggingService } from '../services/loggingService';
import { AuthenticatedRequest } from '../middleware/logging';
import { dataService } from '../services/dataService';
import { config } from '../config/environment';

export class PaymentController {
  public createPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const paymentData: CreatePaymentRequest = req.body;

      // Validar apenas o campo obrigatório (amount)
      if (!paymentData.amount) {
        res.status(400).json({
          success: false,
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

       // Extrair vendor e upsert na tabela vendors
      const vendorId = paymentDataWithDefaults.orderDetails.public?.vendorId || 'default_vendor';
      const vendorMerchant = paymentDataWithDefaults.orderDetails.internal?.vendorMerchant;
      const vendorShare = paymentDataWithDefaults.orderDetails.internal?.vendorShare ?? 85;
      if (vendorMerchant) {
        const vendorPayload: Parameters<typeof dataService.upsertVendor>[0] = {
          vendor_id: vendorId,
          name: vendorMerchant.name || paymentDataWithDefaults.orderDetails.public?.vendorName || vendorId,
          vendor_share: vendorShare,
        };
        if (vendorMerchant.externalId != null) vendorPayload.external_id = String(vendorMerchant.externalId);
        if (vendorMerchant.taxId != null) vendorPayload.tax_id = String(vendorMerchant.taxId);
        if (vendorMerchant.phone != null) vendorPayload.phone = String(vendorMerchant.phone);
        if (vendorMerchant.email != null) vendorPayload.email = String(vendorMerchant.email);
        if (vendorMerchant.address != null) vendorPayload.address = JSON.stringify(vendorMerchant.address);
        if (vendorMerchant.data != null) vendorPayload.data = JSON.stringify(vendorMerchant.data);
        await dataService.upsertVendor(vendorPayload);
      }

       // Simular processamento do pagamento
      const externalPaymentId = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Gerar link interno para o formulário de pagamento
      const internalPaymentLink = `${config.server.baseUrl}/payment-form/${paymentDataWithDefaults.paymentId}`;

      // Salvar pagamento (metadata inclui orderDetails para B2C e comissões)
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
        iframe_link: internalPaymentLink,
        orderDetails: paymentDataWithDefaults.orderDetails
      };

      const dbResult = await dataService.createPayment({
        payment_id: paymentDataWithDefaults.paymentId,
        provider: paymentDataWithDefaults.paymentMethod,
        amount: paymentDataWithDefaults.amount,
        currency: paymentDataWithDefaults.currency,
        status: 'pending',
        customer_id: paymentDataWithDefaults.customer.external?.id || 'default_customer',
        vendor_id: vendorId,
        metadata: JSON.stringify(paymentRecord)
      });
      
      if (dbResult) {
        await loggingService.logPayment({
          paymentId: paymentDataWithDefaults.paymentId,
          externalPaymentId: externalPaymentId,
          action: 'created',
          newStatus: 'pending',
          amount: paymentDataWithDefaults.amount,
          currency: paymentDataWithDefaults.currency,
          customerEmail: paymentDataWithDefaults.customer.email,
          correlationId: req.correlationId || 'unknown',
          metadata: { provider: paymentDataWithDefaults.paymentMethod, orderId: paymentDataWithDefaults.orderDetails?.orderId },
        });
      } else {
        logger.warn('Failed to save payment to database, but continuing with response', {
          correlationId: req.correlationId,
          paymentId: paymentDataWithDefaults.paymentId
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
        responseType: 'REDIRECT',
        link: internalPaymentLink
      };

      logger.info('Payment created successfully', {
        correlationId: req.correlationId,
        paymentId: paymentDataWithDefaults.paymentId,
        externalPaymentId: externalPaymentId,
        responseType: response.responseType
      });

      res.status(201).json({
        success: true,
        ...response,
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

      // Buscar pagamento no SQLite
      const dbResult = await dataService.getPaymentById(paymentId);
      
      if (!dbResult) {
        logger.warn('Payment not found in database', {
          correlationId: req.correlationId,
          paymentId: paymentId
        });
        
        res.status(404).json({
          success: false,
          message: 'Payment not found',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const paymentStatus = {
        paymentId: dbResult.payment_id,
        status: dbResult.status,
        amount: dbResult.amount,
        currency: dbResult.currency,
        created_at: dbResult.created_at,
        updated_at: dbResult.updated_at,
        customer_email: 'demo@example.com', // Placeholder
        customer_name: 'Demo Customer', // Placeholder
        iframe_link: `https://payment-gateway.com/pay/${dbResult.payment_id}` // Placeholder
      };

      res.status(200).json(paymentStatus);

    } catch (error) {
      logger.error('Error getting payment status', {
        correlationId: req.correlationId,
        paymentId: req.params['paymentId'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get payment status',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };
} 