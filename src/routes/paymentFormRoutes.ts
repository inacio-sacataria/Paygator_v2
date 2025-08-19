import { Router, Request, Response } from 'express';
import path from 'path';
import { sqliteService } from '../services/sqliteService';
import { logger } from '../utils/logger';

const router = Router();

// Rota para exibir o formulário de pagamento
router.get('/:paymentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      res.status(400).json({
        success: false,
        message: 'Missing payment ID',
        error: 'Payment ID is required',
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'unknown'
      });
      return;
    }

    logger.info('Displaying payment form', {
      paymentId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Buscar informações do pagamento no banco
    let payment;
    try {
      payment = await sqliteService.getPaymentById(paymentId);
    } catch (dbError) {
      logger.error('Database error when fetching payment', {
        paymentId,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
      
      // Em produção, se houver erro de banco, retornar erro específico
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          success: false,
          message: 'Database connection error',
          error: 'Unable to connect to payment database',
          timestamp: new Date().toISOString(),
          correlation_id: req.headers['x-correlation-id'] || 'unknown'
        });
        return;
      } else {
        // Em desenvolvimento, mostrar erro detalhado
        res.status(500).send(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        return;
      }
    }
    
    if (!payment) {
      logger.warn('Payment not found for form display', { paymentId });
      res.status(404).json({
        success: false,
        message: 'Payment not found',
        error: 'The requested payment ID does not exist',
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'unknown'
      });
      return;
    }

    // Verificar se o pagamento já foi processado
    if (payment.status === 'completed') {
      res.status(400).json({
        success: false,
        message: 'Payment already completed',
        error: 'This payment has already been processed successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'unknown'
      });
      return;
    }

    if (payment.status === 'failed') {
      res.status(400).json({
        success: false,
        message: 'Payment failed',
        error: 'This payment has failed. Please create a new payment.',
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'unknown'
      });
      return;
    }

    // Extrair informações do metadata
    let paymentDetails = {
      amount: payment.amount,
      currency: payment.currency,
      returnUrl: 'https://example.com/success' // URL padrão
    };

    try {
      if (payment.metadata) {
        const metadata = JSON.parse(payment.metadata);
        if (metadata.return_url) {
          paymentDetails.returnUrl = metadata.return_url;
        }
      }
    } catch (error) {
      logger.warn('Failed to parse payment metadata', { paymentId, error });
    }

    // Renderizar o formulário de pagamento
    try {
      res.render('payment-form', {
        paymentId: payment.payment_id,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        returnUrl: paymentDetails.returnUrl
      });
    } catch (renderError) {
      logger.error('Error rendering payment form template', {
        paymentId,
        error: renderError instanceof Error ? renderError.message : 'Unknown render error'
      });
      
      res.status(500).json({
        success: false,
        message: 'Template rendering error',
        error: 'Failed to render payment form template',
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'unknown'
      });
    }

  } catch (error) {
    logger.error('Error displaying payment form', {
      paymentId: req.params['paymentId'],
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'An unexpected error occurred while displaying the payment form',
      timestamp: new Date().toISOString(),
      correlation_id: req.headers['x-correlation-id'] || 'unknown'
    });
  }
});

// Rota para exibir formulário com parâmetros na URL (para compatibilidade)
router.get('/:paymentId/:amount/:currency', async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId, amount, currency } = req.params;
    
    if (!paymentId || !amount || !currency) {
      res.status(400).send('Parâmetros inválidos');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      res.status(400).send('Valor inválido');
      return;
    }

    logger.info('Displaying payment form with URL parameters', {
      paymentId,
      amount: amountNum,
      currency,
      ip: req.ip
    });

    // Buscar informações do pagamento no banco
    const payment = await sqliteService.getPaymentById(paymentId);
    
    if (!payment) {
      logger.warn('Payment not found for form display with URL params', { paymentId });
      res.status(404).send('Pagamento não encontrado');
      return;
    }

    // Verificar se o pagamento já foi processado
    if (payment.status === 'completed') {
      res.status(400).send('Este pagamento já foi processado com sucesso');
      return;
    }

    if (payment.status === 'failed') {
      res.status(400).send('Este pagamento falhou. Crie um novo pagamento.');
      return;
    }

    // Extrair informações do metadata
    let returnUrl = 'https://example.com/success';
    try {
      if (payment.metadata) {
        const metadata = JSON.parse(payment.metadata);
        if (metadata.return_url) {
          returnUrl = metadata.return_url;
        }
      }
    } catch (error) {
      logger.warn('Failed to parse payment metadata', { paymentId, error });
    }

    // Renderizar o formulário de pagamento
    res.render('payment-form', {
      paymentId: payment.payment_id,
      amount: amountNum,
      currency: currency.toUpperCase(),
      returnUrl: returnUrl
    });

  } catch (error) {
    logger.error('Error displaying payment form with URL parameters', {
      paymentId: req.params['paymentId'],
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).send('Erro interno ao exibir formulário de pagamento');
  }
});

export default router;
