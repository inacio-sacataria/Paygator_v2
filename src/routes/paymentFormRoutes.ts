import { Router, Request, Response } from 'express';
import path from 'path';
import { sqliteService } from '../services/sqliteService';
import { logger } from '../utils/logger';

const router = Router();

// Middleware de debug para payment-form
router.use((req, res, next) => {
  logger.info('Payment form route accessed', {
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    headers: {
      'user-agent': req.get('User-Agent'),
      'accept': req.get('Accept'),
      'content-type': req.get('Content-Type')
    },
    ip: req.ip
  });
  next();
});

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
      if (process.env['NODE_ENV'] === 'production') {
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
      // Em produção, se houver erro de renderização, retornar HTML simples
      if (process.env['NODE_ENV'] === 'production') {
        res.render('payment-form', {
          paymentId: payment.payment_id,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          returnUrl: paymentDetails.returnUrl
        });
      } else {
        // Em desenvolvimento, usar renderização normal
        res.render('payment-form', {
          paymentId: payment.payment_id,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          returnUrl: paymentDetails.returnUrl
        });
      }
    } catch (renderError) {
      logger.error('Error rendering payment form template', {
        paymentId,
        error: renderError instanceof Error ? renderError.message : 'Unknown render error'
      });
      
      // Em produção, retornar HTML simples em caso de erro
      if (process.env['NODE_ENV'] === 'production') {
        res.status(500).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Erro no Formulário</title>
            <meta charset="utf-8">
          </head>
          <body>
            <h1>Erro ao carregar formulário</h1>
            <p>Ocorreu um erro ao carregar o formulário de pagamento.</p>
            <p>Erro: ${renderError instanceof Error ? renderError.message : 'Erro desconhecido'}</p>
            <p>Payment ID: ${payment.payment_id}</p>
            <p>Valor: ${paymentDetails.amount} ${paymentDetails.currency}</p>
          </body>
          </html>
        `);
      } else {
        res.status(500).json({
          success: false,
          message: 'Template rendering error',
          error: 'Failed to render payment form template',
          timestamp: new Date().toISOString(),
          correlation_id: req.headers['x-correlation-id'] || 'unknown'
        });
      }
    }

  } catch (error) {
    logger.error('Error displaying payment form', {
      paymentId: req.params['paymentId'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      nodeEnv: process.env['NODE_ENV']
    });

    // Em produção, mostrar erro detalhado para debug
    if (process.env['NODE_ENV'] === 'production') {
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro 500 - Debug</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .error { background: #ffebee; border: 1px solid #f44336; padding: 20px; border-radius: 4px; }
            .details { background: #f5f5f5; padding: 15px; margin-top: 15px; border-radius: 4px; }
            pre { white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>🚨 Erro 500 - Internal Server Error</h1>
            <p><strong>Payment ID:</strong> ${req.params['paymentId'] || 'N/A'}</p>
            <p><strong>Path:</strong> ${req.path}</p>
            <p><strong>Method:</strong> ${req.method}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            
            <div class="details">
              <h3>Detalhes do Erro:</h3>
              <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
              ${error instanceof Error && error.stack ? `
              <h3>Stack Trace:</h3>
              <pre>${error.stack}</pre>
              ` : ''}
            </div>
            
            <div class="details">
              <h3>Environment:</h3>
              <p><strong>NODE_ENV:</strong> ${process.env['NODE_ENV'] || 'undefined'}</p>
              <p><strong>BASE_URL:</strong> ${process.env['BASE_URL'] || 'undefined'}</p>
              <p><strong>PORT:</strong> ${process.env['PORT'] || 'undefined'}</p>
            </div>
            
            <div class="details">
              <h3>Headers:</h3>
              <pre>${JSON.stringify(req.headers, null, 2)}</pre>
            </div>
          </div>
        </body>
        </html>
      `);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'An unexpected error occurred while displaying the payment form',
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'unknown'
      });
    }
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
