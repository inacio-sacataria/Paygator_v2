import { Request, Response } from 'express';
import { CreatePaymentRequest, CreatePaymentResponse } from '../types/payment';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/logging';

export class PaymentController {
  public createPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const paymentData: CreatePaymentRequest = req.body;

      logger.info('Creating payment', {
        correlationId: req.correlationId,
        paymentId: paymentData.paymentId,
        externalPaymentId: paymentData.externalPaymentId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        orderId: paymentData.orderDetails.orderId
      });

      // Validar dados obrigatórios
      if (!paymentData.paymentId || !paymentData.amount || !paymentData.currency) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Missing required fields: paymentId, amount, currency',
          errors: ['paymentId is required', 'amount is required', 'currency is required'],
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      // Simular processamento do pagamento
      const externalPaymentId = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Gerar link do iframe (simulado)
      const iframeLink = `https://payment-gateway.com/pay/${externalPaymentId}?amount=${paymentData.amount}&currency=${paymentData.currency}`;

      const response: CreatePaymentResponse = {
        externalPayment: {
          id: externalPaymentId,
          data: {
            status: 'pending',
            created_at: new Date().toISOString(),
            payment_method: paymentData.paymentMethod,
            amount: paymentData.amount,
            currency: paymentData.currency
          }
        },
        responseType: 'IFRAME',
        link: iframeLink
      };

      logger.info('Payment created successfully', {
        correlationId: req.correlationId,
        paymentId: paymentData.paymentId,
        externalPaymentId: externalPaymentId,
        responseType: response.responseType
      });

      res.status(201).json({
        success: true,
        data: response,
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
        data: null,
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
          data: null,
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

      // Simular busca do status do pagamento
      const paymentStatus = {
        paymentId: paymentId,
        status: 'pending', // ou 'completed', 'failed', 'cancelled'
        amount: 100.00,
        currency: 'BRL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: paymentStatus,
        message: 'Payment status retrieved successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error getting payment status', {
        correlationId: req.correlationId,
        paymentId: req.params['paymentId'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to get payment status',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };
} 