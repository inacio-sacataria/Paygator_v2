import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { sqliteService } from '../services/sqliteService';
import { AuthenticatedRequest } from '../middleware/logging';

export class MpesaController {
  public processMpesaPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { paymentId, phone, amount, currency } = req.body;

      // Validar campos obrigatórios
      if (!paymentId || !phone || !amount || !currency) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: paymentId, phone, amount, currency',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Validar formato do telefone
      if (!phone.match(/^\+258[0-9]{9}$/)) {
        res.status(400).json({
          success: false,
          message: 'Formato de telefone inválido. Use: +258XXXXXXXXX',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      logger.info('Processing M-Pesa payment', {
        correlationId: req.correlationId,
        paymentId,
        phone,
        amount,
        currency
      });

      // Buscar pagamento no banco
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

      // Verificar se o pagamento já foi processado
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

      // Simular processamento M-Pesa
      const mpesaTransactionId = `mpesa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Atualizar pagamento com informações M-Pesa
      await sqliteService.updatePayment(paymentId, {
        status: 'processing',
        metadata: JSON.stringify({
          ...JSON.parse(existingPayment.metadata || '{}'),
          mpesa: {
            transactionId: mpesaTransactionId,
            phone: phone,
            status: 'initiated',
            initiatedAt: new Date().toISOString(),
            amount: amount,
            currency: currency
          }
        })
      });

      logger.info('Payment updated successfully for M-Pesa processing', {
        correlationId: req.correlationId,
        paymentId,
        mpesaTransactionId
      });

      // Simular envio de notificação M-Pesa
      logger.info('M-Pesa payment initiated successfully', {
        correlationId: req.correlationId,
        paymentId,
        mpesaTransactionId,
        phone
      });

      // Retornar sucesso
      res.status(200).json({
        success: true,
        message: 'Pagamento M-Pesa iniciado com sucesso',
        data: {
          transactionId: mpesaTransactionId,
          status: 'processing',
          message: 'Verifique seu telefone para confirmar o pagamento'
        },
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error processing M-Pesa payment', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno ao processar pagamento M-Pesa',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public simulateMpesaCallback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      logger.info('Processing M-Pesa callback', {
        correlationId: req.correlationId,
        paymentId,
        status,
        transactionId
      });

      // Buscar pagamento no banco
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

      // Atualizar status do pagamento
      await sqliteService.updatePayment(paymentId, {
        status: status === 'success' ? 'completed' : 'failed',
        metadata: JSON.stringify({
          ...JSON.parse(existingPayment.metadata || '{}'),
          mpesa: {
            ...JSON.parse(existingPayment.metadata || '{}').mpesa,
            status: status === 'success' ? 'completed' : 'failed',
            completedAt: new Date().toISOString(),
            callbackReceived: true
          }
        })
      });

      logger.info('Payment status updated successfully for M-Pesa callback', {
        correlationId: req.correlationId,
        paymentId,
        status
      });

      logger.info('M-Pesa callback processed successfully', {
        correlationId: req.correlationId,
        paymentId,
        status,
        transactionId
      });

      // Retornar sucesso
      res.status(200).json({
        success: true,
        message: 'Callback M-Pesa processado com sucesso',
        data: {
          paymentId,
          status: status === 'success' ? 'completed' : 'failed',
          transactionId
        },
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error processing M-Pesa callback', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno ao processar callback M-Pesa',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };
}
