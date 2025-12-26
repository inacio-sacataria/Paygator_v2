import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { sqliteService } from '../services/sqliteService';
import { AuthenticatedRequest } from '../middleware/logging';
import { E2PaymentsService } from '../services/e2paymentsService';
import { config } from '../config/environment';

export class EmolaController {
  private e2paymentsService: E2PaymentsService;

  constructor() {
    // Inicializar serviço E2Payments
    this.e2paymentsService = new E2PaymentsService({
      clientId: config.e2payments.clientId,
      clientSecret: config.e2payments.clientSecret,
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

      const existingPayment = await sqliteService.getPaymentById(paymentId);

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
      await sqliteService.updatePayment(paymentId, {
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

      // Gerar referência (máximo 27 caracteres)
      const reference = existingPayment.metadata 
        ? JSON.parse(existingPayment.metadata).reference || `PAYMENT_${paymentId.substring(0, 20)}`
        : `PAYMENT_${paymentId.substring(0, 20)}`;

      // Processar pagamento com E2Payments
      const paymentResult = await this.e2paymentsService.processEmolaPayment({
        phone: phoneNumber, // Usar número sem prefixo +258
        amount: amount,
        reference: reference.substring(0, 27),
      });

      if (paymentResult.success) {
        // Atualizar pagamento com sucesso
        await sqliteService.updatePayment(paymentId, {
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
        await sqliteService.updatePayment(paymentId, {
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

        logger.warn('e-Mola payment failed', {
          correlationId: req.correlationId,
          paymentId,
          error: paymentResult.message,
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

      const existingPayment = await sqliteService.getPaymentById(paymentId);

      if (!existingPayment) {
        res.status(404).json({
          success: false,
          message: 'Pagamento não encontrado',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      await sqliteService.updatePayment(paymentId, {
        status: status === 'success' ? 'completed' : 'failed',
        metadata: JSON.stringify({
          ...JSON.parse(existingPayment.metadata || '{}'),
          emola: {
            ...JSON.parse(existingPayment.metadata || '{}').emola,
            status: status === 'success' ? 'completed' : 'failed',
            completedAt: new Date().toISOString(),
            callbackReceived: true
          }
        })
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
}


