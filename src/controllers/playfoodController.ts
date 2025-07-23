import { Request, Response } from 'express';
import { PlayfoodService } from '../services/playfoodService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/logging';
import { 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  CreatePaymentRequest,
  PlayfoodApiResponse,
  PlayfoodPaginatedResponse,
  PlayfoodOrder,
  PlayfoodPayment
} from '../types/playfood';

export class PlayfoodController {
  private playfoodService: PlayfoodService;

  constructor() {
    this.playfoodService = new PlayfoodService();
  }

  // Orders endpoints
  public createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const orderData: CreateOrderRequest = req.body;

      const order = await this.playfoodService.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error creating order', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Failed to create order',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public getOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Order ID is required',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const order = await this.playfoodService.getOrder(id);

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order retrieved successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error getting order', {
        correlationId: req.correlationId,
        orderId: req.params['id'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(404).json({
        success: false,
        data: null,
        message: 'Order not found',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public listOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;
      const status = req.query['status'] as string;
      const customer_id = req.query['customer_id'] as string;

      const orders = await this.playfoodService.listOrders(page, limit, status, customer_id);

      res.status(200).json({
        success: true,
        data: orders.data,
        pagination: orders.pagination,
        message: 'Orders retrieved successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error listing orders', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve orders',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public updateOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateOrderRequest = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Order ID is required',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const order = await this.playfoodService.updateOrder(id, updateData);

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order updated successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error updating order', {
        correlationId: req.correlationId,
        orderId: req.params['id'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Failed to update order',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public cancelOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Order ID is required',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const order = await this.playfoodService.cancelOrder(id, reason);

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order cancelled successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error cancelling order', {
        correlationId: req.correlationId,
        orderId: req.params['id'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Failed to cancel order',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  // Payments endpoints
  public createPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const paymentData: CreatePaymentRequest = req.body;

      const payment = await this.playfoodService.createPayment(paymentData);

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment created successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error creating payment', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Failed to create payment',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public getPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Payment ID is required',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const payment = await this.playfoodService.getPayment(id);

      res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment retrieved successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error getting payment', {
        correlationId: req.correlationId,
        paymentId: req.params['id'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(404).json({
        success: false,
        data: null,
        message: 'Payment not found',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public listPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;
      const status = req.query['status'] as string;
      const order_id = req.query['order_id'] as string;

      const payments = await this.playfoodService.listPayments(page, limit, status, order_id);

      res.status(200).json({
        success: true,
        data: payments.data,
        pagination: payments.pagination,
        message: 'Payments retrieved successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error listing payments', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve payments',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public refundPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Payment ID is required',
          timestamp: new Date().toISOString(),
          correlation_id: req.correlationId || 'unknown'
        });
        return;
      }

      const payment = await this.playfoodService.refundPayment(id, amount, reason);

      res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment refunded successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error refunding payment', {
        correlationId: req.correlationId,
        paymentId: req.params['id'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(400).json({
        success: false,
        data: null,
        message: 'Failed to refund payment',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public handleWebhook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const webhookData = req.body;

      logger.info('Processing PlayFood webhook', {
        correlationId: req.correlationId,
        webhookData: webhookData
      });

      // Processar webhook do PlayFood
      const result = {
        processed: true,
        webhook_id: webhookData.id || 'unknown',
        event_type: webhookData.event_type || 'unknown'
      };

      res.status(200).json({
        success: true,
        data: result,
        message: 'PlayFood webhook processed successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error processing PlayFood webhook', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to process PlayFood webhook',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };

  public getStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Usar Supabase para verificar status do banco de dados
      const { supabaseService } = await import('../config/database.js');
      const dbStatus = await supabaseService.getServiceStatus();
      
      // Combinar status do serviço PlayFood com status do banco
      const status = {
        service: 'playfood',
        status: 'operational',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
          orders: '/api/v1/playfood/orders',
          payments: '/api/v1/playfood/payments',
          webhooks: '/api/v1/playfood/webhooks'
        }
      };

      res.status(200).json({
        success: true,
        data: status,
        message: 'PlayFood status retrieved successfully',
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });

    } catch (error) {
      logger.error('Error getting PlayFood status', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve PlayFood status',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        correlation_id: req.correlationId || 'unknown'
      });
    }
  };
} 