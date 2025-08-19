import { Router, Request, Response } from 'express';
import path from 'path';
import { sqliteService } from '../services/sqliteService';
import { logger } from '../utils/logger';

const router = Router();

// Rota para exibir o formulário de pagamento
router.get('/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).send('ID do pagamento é obrigatório');
    }

    logger.info('Displaying payment form', {
      paymentId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Buscar informações do pagamento no banco
    const payment = await sqliteService.getPaymentById(paymentId);
    
    if (!payment) {
      logger.warn('Payment not found for form display', { paymentId });
      return res.status(404).send('Pagamento não encontrado');
    }

    // Verificar se o pagamento já foi processado
    if (payment.status === 'completed') {
      return res.status(400).send('Este pagamento já foi processado com sucesso');
    }

    if (payment.status === 'failed') {
      return res.status(400).send('Este pagamento falhou. Crie um novo pagamento.');
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
    res.render('payment-form', {
      paymentId: payment.payment_id,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      returnUrl: paymentDetails.returnUrl
    });

  } catch (error) {
    logger.error('Error displaying payment form', {
      paymentId: req.params.paymentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).send('Erro interno ao exibir formulário de pagamento');
  }
});

// Rota para exibir formulário com parâmetros na URL (para compatibilidade)
router.get('/:paymentId/:amount/:currency', async (req: Request, res: Response) => {
  try {
    const { paymentId, amount, currency } = req.params;
    
    if (!paymentId || !amount || !currency) {
      return res.status(400).send('Parâmetros inválidos');
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).send('Valor inválido');
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
      return res.status(404).send('Pagamento não encontrado');
    }

    // Verificar se o pagamento já foi processado
    if (payment.status === 'completed') {
      return res.status(400).send('Este pagamento já foi processado com sucesso');
    }

    if (payment.status === 'failed') {
      return res.status(400).send('Este pagamento falhou. Crie um novo pagamento.');
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
      paymentId: req.params.paymentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).send('Erro interno ao exibir formulário de pagamento');
  }
});

export default router;
