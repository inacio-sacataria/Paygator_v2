import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { sqliteService } from '../services/sqliteService';
import { AuthenticatedRequest } from '../middleware/logging';
import { TheCodeService } from '../services/thecodeService';
import { config } from '../config/environment';

export class MpesaController {
  private thecodeService: TheCodeService;

  constructor() {
    // Inicializar serviço TheCode
    this.thecodeService = new TheCodeService({
      clientId: config.thecode.clientId,
      clientSecret: config.thecode.clientSecret,
      authUrl: config.thecode.authUrl,
      apiUrl: config.thecode.apiUrl,
      mpesaWallet: config.thecode.mpesaWallet,
    });
  }

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

      // Validar formato do telefone (deve começar com 84 ou 85 para M-Pesa)
      const phoneNumber = phone.replace(/^\+258/, ''); // Remover prefixo +258 se presente
      if (!phoneNumber.match(/^(84|85)[0-9]{7}$/)) {
        res.status(400).json({
          success: false,
          message: 'Formato de telefone inválido para M-Pesa. Use número começando com 84 ou 85',
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

      // Atualizar status para processing
      await sqliteService.updatePayment(paymentId, {
        status: 'processing',
        metadata: JSON.stringify({
          ...JSON.parse(existingPayment.metadata || '{}'),
          mpesa: {
            phone: phone,
            status: 'initiated',
            initiatedAt: new Date().toISOString(),
            amount: amount,
            currency: currency
          }
        })
      });

      // Gerar referência única (máximo 15 caracteres para M-Pesa)
      // A referência deve ser única para cada transação e não pode ser reutilizada
      // Usar timestamp + hash do paymentId para garantir unicidade
      const timestamp = Date.now().toString().slice(-8); // Últimos 8 dígitos do timestamp
      const paymentHash = paymentId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6); // Primeiros 6 caracteres alfanuméricos
      const reference = `MP${timestamp}${paymentHash}`.substring(0, 15); // Máximo 15 caracteres

      logger.info('M-Pesa - Referência gerada', {
        correlationId: req.correlationId,
        paymentId,
        reference,
        referenceLength: reference.length
      });

      // Processar pagamento com TheCode
      const paymentResult = await this.thecodeService.processMpesaPayment({
        phone: phoneNumber, // Usar número sem prefixo +258
        amount: amount,
        reference: reference,
      });

      if (paymentResult.success) {
        // Atualizar pagamento com sucesso
        await sqliteService.updatePayment(paymentId, {
          status: 'completed',
          metadata: JSON.stringify({
            ...JSON.parse(existingPayment.metadata || '{}'),
            mpesa: {
              ...JSON.parse(existingPayment.metadata || '{}').mpesa,
              transactionId: paymentResult.transactionId || `mpesa_${Date.now()}`,
              status: 'completed',
              completedAt: new Date().toISOString(),
              reference: reference,
              responseData: paymentResult.data,
            }
          })
        });

        logger.info('M-Pesa payment processed successfully', {
          correlationId: req.correlationId,
          paymentId,
          transactionId: paymentResult.transactionId,
          phone
        });

        // Retornar sucesso
        res.status(200).json({
          success: true,
          message: 'Pagamento M-Pesa processado com sucesso',
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
            mpesa: {
              ...JSON.parse(existingPayment.metadata || '{}').mpesa,
              status: 'failed',
              failedAt: new Date().toISOString(),
              error: paymentResult.message,
              responseData: paymentResult.data,
            }
          })
        });

        logger.warn('M-Pesa payment failed', {
          correlationId: req.correlationId,
          paymentId,
          error: paymentResult.message,
        });

        res.status(400).json({
          success: false,
          message: paymentResult.message || 'Falha ao processar pagamento M-Pesa',
          data: {
            status: 'failed',
            error: paymentResult.message,
          },
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
      }

    } catch (error) {
      logger.error('Error processing M-Pesa payment', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
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
