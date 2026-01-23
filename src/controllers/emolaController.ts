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
          emolaB2C: {
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

      // Processar pagamento B2C com E2Payments
      const paymentResult = await this.e2paymentsService.processEmolaB2CPayment({
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
        await sqliteService.updatePayment(paymentId, {
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
          emolaB2C: {
            ...JSON.parse(existingPayment.metadata || '{}').emolaB2C,
            status: status === 'success' ? 'completed' : 'failed',
            completedAt: new Date().toISOString(),
            callbackReceived: true
          }
        })
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
   * Calcula a comissão do sistema e envia o valor líquido ao vendor
   */
  public processVendorB2CPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { paymentId, commissionPercentage } = req.body;

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

      // Buscar pagamento C2B original
      const originalPayment = await sqliteService.getPaymentById(paymentId);

      if (!originalPayment) {
        res.status(404).json({
          success: false,
          message: 'Pagamento não encontrado',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Verificar se o pagamento C2B foi completado
      if (originalPayment.status !== 'completed' && originalPayment.status !== 'approved') {
        res.status(400).json({
          success: false,
          message: 'O pagamento C2B deve estar completado antes de processar o pagamento ao vendor',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Verificar se já foi pago ao vendor
      const metadata = JSON.parse(originalPayment.metadata || '{}');
      if (metadata.vendorB2CPayment && metadata.vendorB2CPayment.status === 'completed') {
        res.status(400).json({
          success: false,
          message: 'Vendor já foi pago para este pagamento',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Obter informações do vendor do metadata
      const orderDetails = metadata.orderDetails || {};
      const internalData = orderDetails.internal || {};
      const vendorMerchant = internalData.vendorMerchant || {};
      const vendorShare = internalData.vendorShare || 100; // Porcentagem que o vendor recebe (0-100)
      
      // Usar commissionPercentage do request ou calcular baseado no vendorShare
      let systemCommission: number;
      if (commissionPercentage !== undefined && commissionPercentage !== null && commissionPercentage !== '') {
        const parsedCommission = parseFloat(commissionPercentage.toString());
        if (isNaN(parsedCommission)) {
          res.status(400).json({
            success: false,
            message: 'Comissão deve ser um número válido',
            timestamp: new Date().toISOString(),
            correlation_id: req.correlationId || 'unknown'
          });
          return;
        }
        systemCommission = parsedCommission;
      } else {
        // Comissão do sistema = 100 - vendorShare
        systemCommission = 100 - vendorShare;
      }

      // Validar comissão
      if (systemCommission < 0 || systemCommission > 100) {
        res.status(400).json({
          success: false,
          message: 'Comissão deve estar entre 0 e 100',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Calcular valores
      const totalAmount = originalPayment.amount;
      const vendorAmount = totalAmount * (vendorShare / 100);
      const systemCommissionAmount = totalAmount * (systemCommission / 100);

      // Obter telefone do vendor
      const vendorPhone = vendorMerchant.phone || req.body.vendorPhone;
      if (!vendorPhone) {
        res.status(400).json({
          success: false,
          message: 'Telefone do vendor não encontrado. Forneça vendorPhone no request ou configure no vendorMerchant',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Validar formato do telefone
      const phoneNumber = vendorPhone.replace(/^\+258/, '');
      if (!phoneNumber.match(/^(86|87)[0-9]{7}$/)) {
        res.status(400).json({
          success: false,
          message: 'Formato de telefone inválido para Emola. Use número começando com 86 ou 87',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Atualizar metadata com informações do pagamento B2C
      metadata.vendorB2CPayment = {
        status: 'processing',
        initiatedAt: new Date().toISOString(),
        totalAmount: totalAmount,
        vendorAmount: vendorAmount,
        systemCommission: systemCommission,
        systemCommissionAmount: systemCommissionAmount,
        vendorShare: vendorShare,
        vendorPhone: vendorPhone
      };

      await sqliteService.updatePayment(paymentId, {
        metadata: JSON.stringify(metadata)
      });

      // Gerar referência única para o pagamento B2C
      const reference = `VENDOR_${paymentId.substring(0, 20)}_${Date.now()}`.substring(0, 27);

      // Processar pagamento B2C ao vendor
      const paymentResult = await this.e2paymentsService.processEmolaB2CPayment({
        phone: phoneNumber,
        amount: vendorAmount,
        reference: reference,
      });

      if (paymentResult.success) {
        // Atualizar metadata com sucesso
        metadata.vendorB2CPayment = {
          ...metadata.vendorB2CPayment,
          transactionId: paymentResult.transactionId || `vendor_b2c_${Date.now()}`,
          status: 'completed',
          completedAt: new Date().toISOString(),
          reference: reference,
          responseData: paymentResult.data,
        };

        await sqliteService.updatePayment(paymentId, {
          metadata: JSON.stringify(metadata)
        });

        logger.info('Vendor B2C payment processed successfully', {
          correlationId: req.correlationId,
          paymentId,
          transactionId: paymentResult.transactionId,
          vendorAmount,
          systemCommissionAmount,
          vendorPhone
        });

        res.status(200).json({
          success: true,
          message: 'Pagamento B2C ao vendor processado com sucesso',
          data: {
            transactionId: paymentResult.transactionId,
            status: 'completed',
            reference: reference,
            type: 'B2C_VENDOR',
            totalAmount: totalAmount,
            vendorAmount: vendorAmount,
            systemCommission: systemCommission,
            systemCommissionAmount: systemCommissionAmount,
            vendorShare: vendorShare
          },
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
      } else {
        // Atualizar metadata com falha
        metadata.vendorB2CPayment = {
          ...metadata.vendorB2CPayment,
          status: 'failed',
          failedAt: new Date().toISOString(),
          error: paymentResult.message,
          responseData: paymentResult.data,
        };

        await sqliteService.updatePayment(paymentId, {
          metadata: JSON.stringify(metadata)
        });

        logger.warn('Vendor B2C payment failed', {
          correlationId: req.correlationId,
          paymentId,
          error: paymentResult.message,
        });

        res.status(400).json({
          success: false,
          message: paymentResult.message || 'Falha ao processar pagamento B2C ao vendor',
          data: {
            status: 'failed',
            error: paymentResult.message,
            type: 'B2C_VENDOR'
          },
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
      }

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


