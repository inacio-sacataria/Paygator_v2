import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { dataService } from '../services/dataService';
import { loggingService } from '../services/loggingService';
import { AuthenticatedRequest } from '../middleware/logging';
import { E2PaymentsService } from '../services/e2paymentsService';
import { vendorPayoutService } from '../services/vendorPayoutService';
import { config } from '../config/environment';

export class EmolaController {
  private e2paymentsService: E2PaymentsService;

  constructor() {
    // Inicializar serviço E2Payments
    this.e2paymentsService = new E2PaymentsService({
      clientId: config.e2payments.clientId,
      clientSecret: config.e2payments.clientSecret,
      authUrl: config.e2payments.authUrl,
      apiUrl: config.e2payments.apiUrl,
      emolaWallet: config.e2payments.emolaWallet,
    });
  }

  public processEmolaPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { paymentId, phone, amount, currency } = req.body;

      if (!paymentId || !phone || !amount || !currency) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: paymentId, phone, amount, currency',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Validar formato do telefone (deve começar com 86 ou 87 para Emola)
      const phoneNumber = phone.replace(/^\+258/, ''); // Remover prefixo +258 se presente
      if (!phoneNumber.match(/^(86|87)[0-9]{7}$/)) {
        res.status(400).json({
          success: false,
          message: 'Formato de telefone inválido para Emola. Use número começando com 86 ou 87',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      logger.info('Processing e-Mola payment', {
        correlationId: req.correlationId,
        paymentId,
        phone,
        amount,
        currency
      });

      const existingPayment = await dataService.getPaymentById(paymentId);

      if (!existingPayment) {
        res.status(404).json({
          success: false,
          message: 'Pagamento não encontrado',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      if (existingPayment.status === 'completed') {
        res.status(400).json({
          success: false,
          message: 'Pagamento já foi processado com sucesso',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      if (existingPayment.status === 'failed') {
        res.status(400).json({
          success: false,
          message: 'Pagamento falhou anteriormente. Crie um novo pagamento.',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Atualizar status para processing
      await dataService.updatePayment(paymentId, {
        status: 'processing',
        metadata: JSON.stringify({
          ...JSON.parse(existingPayment.metadata || '{}'),
          emola: {
            phone: phone,
            status: 'initiated',
            initiatedAt: new Date().toISOString(),
            amount: amount,
            currency: currency
          }
        })
      });

      await loggingService.logPayment({
        paymentId,
        action: 'status_changed',
        previousStatus: existingPayment.status,
        newStatus: 'processing',
        amount: Number(amount),
        currency,
        ...(existingPayment.customer_id ? { customerEmail: existingPayment.customer_id } : {}),
        correlationId: req.correlationId || 'unknown',
        metadata: { provider: 'emola', type: 'c2b', phone },
      });

      // Gerar referência (máximo 27 caracteres)
      const reference = existingPayment.metadata 
        ? JSON.parse(existingPayment.metadata).reference || `PAYMENT_${paymentId.substring(0, 20)}`
        : `PAYMENT_${paymentId.substring(0, 20)}`;

      // Preparar dados para o pagamento
      const paymentRequest = {
        phone: phoneNumber, // Usar número sem prefixo +258
        amount: amount,
        reference: reference.substring(0, 27),
      };

      logger.info('e-Mola - Iniciando processamento de pagamento', {
        correlationId: req.correlationId,
        paymentId,
        paymentRequest,
        originalPhone: phone,
        phoneNumber,
        amount,
        currency,
        reference: reference.substring(0, 27),
      });

      // Processar pagamento com E2Payments
      const paymentResult = await this.e2paymentsService.processEmolaPayment(paymentRequest);

      logger.info('e-Mola - Resultado do processamento', {
        correlationId: req.correlationId,
        paymentId,
        success: paymentResult.success,
        message: paymentResult.message,
        transactionId: paymentResult.transactionId,
        responseData: paymentResult.data,
      });

      if (paymentResult.success) {
        // Atualizar pagamento com sucesso
        await dataService.updatePayment(paymentId, {
          status: 'completed',
          metadata: JSON.stringify({
            ...JSON.parse(existingPayment.metadata || '{}'),
            emola: {
              ...JSON.parse(existingPayment.metadata || '{}').emola,
              transactionId: paymentResult.transactionId || `emola_${Date.now()}`,
              status: 'completed',
              completedAt: new Date().toISOString(),
              reference: reference,
              responseData: paymentResult.data,
            }
          })
        });

        await loggingService.logPayment({
          paymentId,
          action: 'status_changed',
          previousStatus: 'processing',
          newStatus: 'completed',
          amount: Number(amount),
          currency,
          ...(existingPayment.customer_id ? { customerEmail: existingPayment.customer_id } : {}),
          correlationId: req.correlationId || 'unknown',
          metadata: { provider: 'emola', type: 'c2b', transactionId: paymentResult.transactionId, reference },
        });

        logger.info('e-Mola payment processed successfully', {
          correlationId: req.correlationId,
          paymentId,
          transactionId: paymentResult.transactionId,
          phone
        });

        res.status(200).json({
          success: true,
          message: 'Pagamento e-Mola processado com sucesso',
          data: {
            transactionId: paymentResult.transactionId,
            status: 'completed',
            reference: reference,
          },
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
      } else {
        // Atualizar pagamento com falha
        await dataService.updatePayment(paymentId, {
          status: 'failed',
          metadata: JSON.stringify({
            ...JSON.parse(existingPayment.metadata || '{}'),
            emola: {
              ...JSON.parse(existingPayment.metadata || '{}').emola,
              status: 'failed',
              failedAt: new Date().toISOString(),
              error: paymentResult.message,
              responseData: paymentResult.data,
            }
          })
        });

        await loggingService.logPayment({
          paymentId,
          action: 'failed',
          previousStatus: 'processing',
          newStatus: 'failed',
          amount: Number(amount),
          currency,
          ...(existingPayment.customer_id ? { customerEmail: existingPayment.customer_id } : {}),
          ...(paymentResult.message ? { errorMessage: paymentResult.message } : {}),
          correlationId: req.correlationId || 'unknown',
          metadata: { provider: 'emola', type: 'c2b', responseData: paymentResult.data },
        });

        logger.warn('e-Mola payment failed', {
          correlationId: req.correlationId,
          paymentId,
          error: paymentResult.message,
          responseData: paymentResult.data,
          paymentRequest,
        });

        res.status(400).json({
          success: false,
          message: paymentResult.message || 'Falha ao processar pagamento e-Mola',
          data: {
            status: 'failed',
            error: paymentResult.message,
          },
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
      }

    } catch (error) {
      logger.error('Error processing e-Mola payment', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno ao processar pagamento e-Mola',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public simulateEmolaCallback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { paymentId, status, transactionId } = req.body;

      if (!paymentId || !status || !transactionId) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: paymentId, status, transactionId',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      logger.info('Processing e-Mola callback', {
        correlationId: req.correlationId,
        paymentId,
        status,
        transactionId
      });

      const existingPayment = await dataService.getPaymentById(paymentId);

      if (!existingPayment) {
        res.status(404).json({
          success: false,
          message: 'Pagamento não encontrado',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const newStatus = status === 'success' ? 'completed' : 'failed';
      await dataService.updatePayment(paymentId, {
        status: newStatus,
        metadata: JSON.stringify({
          ...JSON.parse(existingPayment.metadata || '{}'),
          emola: {
            ...JSON.parse(existingPayment.metadata || '{}').emola,
            status: newStatus,
            completedAt: new Date().toISOString(),
            callbackReceived: true
          }
        })
      });

      await loggingService.logPayment({
        paymentId,
        externalPaymentId: transactionId,
        action: 'status_changed',
        previousStatus: existingPayment.status,
        newStatus,
        amount: existingPayment.amount,
        ...(existingPayment.currency ? { currency: existingPayment.currency } : {}),
        ...(existingPayment.customer_id ? { customerEmail: existingPayment.customer_id } : {}),
        correlationId: req.correlationId || 'unknown',
        metadata: { provider: 'emola', type: 'c2b_callback', transactionId },
      });

      logger.info('Payment status updated successfully for e-Mola callback', {
        correlationId: req.correlationId,
        paymentId,
        status
      });

      res.status(200).json({
        success: true,
        message: 'Callback e-Mola processado com sucesso',
        data: {
          paymentId,
          status: status === 'success' ? 'completed' : 'failed',
          transactionId
        },
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error processing e-Mola callback', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno ao processar callback e-Mola',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public processEmolaB2CPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { paymentId, phone, amount, currency } = req.body;

      if (!paymentId || !phone || !amount || !currency) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: paymentId, phone, amount, currency',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Validar formato do telefone (deve começar com 86 ou 87 para Emola)
      const phoneNumber = phone.replace(/^\+258/, ''); // Remover prefixo +258 se presente
      if (!phoneNumber.match(/^(86|87)[0-9]{7}$/)) {
        res.status(400).json({
          success: false,
          message: 'Formato de telefone inválido para Emola. Use número começando com 86 ou 87',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      logger.info('Processing e-Mola B2C payment', {
        correlationId: req.correlationId,
        paymentId,
        phone,
        amount,
        currency
      });

      const existingPayment = await dataService.getPaymentById(paymentId);

      if (!existingPayment) {
        res.status(404).json({
          success: false,
          message: 'Pagamento não encontrado',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      if (existingPayment.status === 'completed') {
        res.status(400).json({
          success: false,
          message: 'Pagamento já foi processado com sucesso',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      if (existingPayment.status === 'failed') {
        res.status(400).json({
          success: false,
          message: 'Pagamento falhou anteriormente. Crie um novo pagamento.',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Atualizar status para processing
      await dataService.updatePayment(paymentId, {
        status: 'processing',
        metadata: JSON.stringify({
          ...JSON.parse(existingPayment.metadata || '{}'),
          emolaB2C: {
            phone: phone,
            status: 'initiated',
            initiatedAt: new Date().toISOString(),
            amount: amount,
            currency: currency
          }
        })
      });

      await loggingService.logPayment({
        paymentId,
        action: 'status_changed',
        previousStatus: existingPayment.status,
        newStatus: 'processing',
        amount: Number(amount),
        currency,
        ...(existingPayment.customer_id ? { customerEmail: existingPayment.customer_id } : {}),
        correlationId: req.correlationId || 'unknown',
        metadata: { provider: 'emola', type: 'b2c', phone },
      });

      // Gerar referência (máximo 27 caracteres)
      const reference = existingPayment.metadata 
        ? JSON.parse(existingPayment.metadata).reference || `PAYMENT_${paymentId.substring(0, 20)}`
        : `PAYMENT_${paymentId.substring(0, 20)}`;

      // Processar pagamento B2C com E2Payments
      const paymentResult = await this.e2paymentsService.processEmolaB2CPayment({
        phone: phoneNumber, // Usar número sem prefixo +258
        amount: amount,
        reference: reference.substring(0, 27),
      });

      if (paymentResult.success) {
        // Atualizar pagamento com sucesso
        await dataService.updatePayment(paymentId, {
          status: 'completed',
          metadata: JSON.stringify({
            ...JSON.parse(existingPayment.metadata || '{}'),
            emolaB2C: {
              ...JSON.parse(existingPayment.metadata || '{}').emolaB2C,
              transactionId: paymentResult.transactionId || `emola_b2c_${Date.now()}`,
              status: 'completed',
              completedAt: new Date().toISOString(),
              reference: reference,
              responseData: paymentResult.data,
            }
          })
        });

        await loggingService.logPayment({
          paymentId,
          action: 'status_changed',
          previousStatus: 'processing',
          newStatus: 'completed',
          amount: Number(amount),
          currency,
          ...(existingPayment.customer_id ? { customerEmail: existingPayment.customer_id } : {}),
          correlationId: req.correlationId || 'unknown',
          metadata: { provider: 'emola', type: 'b2c', transactionId: paymentResult.transactionId, reference },
        });

        logger.info('e-Mola B2C payment processed successfully', {
          correlationId: req.correlationId,
          paymentId,
          transactionId: paymentResult.transactionId,
          phone
        });

        res.status(200).json({
          success: true,
          message: 'Pagamento e-Mola B2C processado com sucesso',
          data: {
            transactionId: paymentResult.transactionId,
            status: 'completed',
            reference: reference,
            type: 'B2C'
          },
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
      } else {
        // Atualizar pagamento com falha
        await dataService.updatePayment(paymentId, {
          status: 'failed',
          metadata: JSON.stringify({
            ...JSON.parse(existingPayment.metadata || '{}'),
            emolaB2C: {
              ...JSON.parse(existingPayment.metadata || '{}').emolaB2C,
              status: 'failed',
              failedAt: new Date().toISOString(),
              error: paymentResult.message,
              responseData: paymentResult.data,
            }
          })
        });

        await loggingService.logPayment({
          paymentId,
          action: 'failed',
          previousStatus: 'processing',
          newStatus: 'failed',
          amount: Number(amount),
          currency,
          ...(existingPayment.customer_id ? { customerEmail: existingPayment.customer_id } : {}),
          ...(paymentResult.message ? { errorMessage: paymentResult.message } : {}),
          correlationId: req.correlationId || 'unknown',
          metadata: { provider: 'emola', type: 'b2c', responseData: paymentResult.data },
        });

        logger.warn('e-Mola B2C payment failed', {
          correlationId: req.correlationId,
          paymentId,
          error: paymentResult.message,
        });

        res.status(400).json({
          success: false,
          message: paymentResult.message || 'Falha ao processar pagamento e-Mola B2C',
          data: {
            status: 'failed',
            error: paymentResult.message,
            type: 'B2C'
          },
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
      }

    } catch (error) {
      logger.error('Error processing e-Mola B2C payment', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno ao processar pagamento e-Mola B2C',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public simulateEmolaB2CCallback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { paymentId, status, transactionId } = req.body;

      if (!paymentId || !status || !transactionId) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: paymentId, status, transactionId',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      logger.info('Processing e-Mola B2C callback', {
        correlationId: req.correlationId,
        paymentId,
        status,
        transactionId
      });

      const existingPayment = await dataService.getPaymentById(paymentId);

      if (!existingPayment) {
        res.status(404).json({
          success: false,
          message: 'Pagamento não encontrado',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const newStatusB2C = status === 'success' ? 'completed' : 'failed';
      await dataService.updatePayment(paymentId, {
        status: newStatusB2C,
        metadata: JSON.stringify({
          ...JSON.parse(existingPayment.metadata || '{}'),
          emolaB2C: {
            ...JSON.parse(existingPayment.metadata || '{}').emolaB2C,
            status: newStatusB2C,
            completedAt: new Date().toISOString(),
            callbackReceived: true
          }
        })
      });

      await loggingService.logPayment({
        paymentId,
        externalPaymentId: transactionId,
        action: 'status_changed',
        previousStatus: existingPayment.status,
        newStatus: newStatusB2C,
        amount: existingPayment.amount,
        ...(existingPayment.currency ? { currency: existingPayment.currency } : {}),
        ...(existingPayment.customer_id ? { customerEmail: existingPayment.customer_id } : {}),
        correlationId: req.correlationId || 'unknown',
        metadata: { provider: 'emola', type: 'b2c_callback', transactionId },
      });

      logger.info('Payment status updated successfully for e-Mola B2C callback', {
        correlationId: req.correlationId,
        paymentId,
        status
      });

      res.status(200).json({
        success: true,
        message: 'Callback e-Mola B2C processado com sucesso',
        data: {
          paymentId,
          status: status === 'success' ? 'completed' : 'failed',
          transactionId,
          type: 'B2C'
        },
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error processing e-Mola B2C callback', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno ao processar callback e-Mola B2C',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  /**
   * Processa pagamento B2C ao vendor após pagamento C2B ser completado
   * Usa vendorPayoutService (comissões gravadas em vendor_payouts)
   */
  public processVendorB2CPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { paymentId, commissionPercentage, vendorPhone } = req.body;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: 'Campo obrigatório: paymentId',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      logger.info('Processing vendor B2C payment', {
        correlationId: req.correlationId,
        paymentId,
        commissionPercentage
      });

      const options: { correlationId: string; commissionPercentage?: number; vendorPhone?: string } = {
        correlationId: req.correlationId || 'unknown',
      };
      if (commissionPercentage != null && String(commissionPercentage).trim() !== '') {
        options.commissionPercentage = parseFloat(String(commissionPercentage));
      }
      if (vendorPhone) options.vendorPhone = vendorPhone;
      const result = await vendorPayoutService.processOneVendorB2C(paymentId, options);

      if (result.success && result.data) {
        res.status(200).json({
          success: true,
          message: 'Pagamento B2C ao vendor processado com sucesso',
          data: {
            transactionId: result.data.transactionId,
            status: 'completed',
            type: 'B2C_VENDOR',
            totalAmount: result.data.totalAmount,
            vendorAmount: result.data.vendorAmount,
            systemCommission: result.data.systemCommission,
            systemCommissionAmount: result.data.systemCommissionAmount,
            vendorShare: result.data.vendorShare
          },
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const statusCode = result.error === 'Pagamento não encontrado' ? 404 : (result.error?.includes('já foi pago') || result.error?.includes('deve estar completado') || result.error?.includes('Telefone') || result.error?.includes('Comissão') || result.error?.includes('Formato') ? 400 : 400);
      res.status(statusCode).json({
        success: false,
        message: result.error || 'Falha ao processar pagamento B2C ao vendor',
        data: result.data ? { status: 'failed', type: 'B2C_VENDOR' } : undefined,
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    } catch (error) {
      logger.error('Error processing vendor B2C payment', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno ao processar pagamento B2C ao vendor',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };
}


