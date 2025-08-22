import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { sqliteService } from '../services/sqliteService';
import { AuthenticatedRequest } from '../middleware/logging';

export class EmolaController {
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

      if (!phone.match(/^\+258[0-9]{9}$/)) {
        res.status(400).json({
          success: false,
          message: 'Formato de telefone inválido. Use: +258XXXXXXXXX',
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

      const emolaTransactionId = `emola_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await sqliteService.updatePayment(paymentId, {
        status: 'processing',
        metadata: JSON.stringify({
          ...JSON.parse(existingPayment.metadata || '{}'),
          emola: {
            transactionId: emolaTransactionId,
            phone: phone,
            status: 'initiated',
            initiatedAt: new Date().toISOString(),
            amount: amount,
            currency: currency
          }
        })
      });

      logger.info('Payment updated successfully for e-Mola processing', {
        correlationId: req.correlationId,
        paymentId,
        emolaTransactionId
      });

      logger.info('e-Mola payment initiated successfully', {
        correlationId: req.correlationId,
        paymentId,
        emolaTransactionId,
        phone
      });

      setTimeout(async () => {
        try {
          logger.info('Simulating automatic e-Mola payment confirmation', {
            correlationId: req.correlationId,
            paymentId,
            emolaTransactionId
          });

          await sqliteService.updatePayment(paymentId, {
            status: 'completed',
            metadata: JSON.stringify({
              ...JSON.parse(existingPayment.metadata || '{}'),
              emola: {
                ...JSON.parse(existingPayment.metadata || '{}').emola,
                status: 'completed',
                completedAt: new Date().toISOString(),
                autoConfirmed: true,
                confirmedAt: new Date().toISOString()
              }
            })
          });

          logger.info('Payment automatically confirmed as completed (e-Mola)', {
            correlationId: req.correlationId,
            paymentId,
            status: 'completed'
          });
        } catch (error) {
          logger.error('Error in automatic e-Mola payment confirmation', {
            correlationId: req.correlationId,
            paymentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }, 5000);

      res.status(200).json({
        success: true,
        message: 'Pagamento e-Mola iniciado com sucesso',
        data: {
          transactionId: emolaTransactionId,
          status: 'processing',
          message: 'Verifique seu telefone para confirmar o pagamento'
        },
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error processing e-Mola payment', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
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


