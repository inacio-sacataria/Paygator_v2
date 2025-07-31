import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { adminService } from '../services/adminService';
import '../types/session';

const router = Router();

// Configuração simples de senha (em produção, use hash e banco)
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] || 'admin123';

// Middleware de autenticação simples
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.admin) {
    return next();
  }
  res.redirect('/admin/login');
}

// Página de login
router.get('/login', (req, res) => {
  res.render('admin/login', { error: null });
});

// Login POST
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    if (req.session) {
      req.session.admin = true;
    }
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: 'Senha incorreta!' });
});

// Logout
router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.admin = false;
  }
  res.redirect('/admin/login');
});

// API endpoint for dashboard stats
router.get('/api/stats', async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard stats'
    });
  }
});

// API endpoint for payments list
router.get('/api/payments', async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const status = req.query['status'] as string;
    const method = req.query['method'] as string;
    const dateFromStr = req.query['dateFrom'] as string;
    const dateToStr = req.query['dateTo'] as string;

    const filter: any = {
      page,
      limit: 10
    };

    if (status) filter.status = status;
    if (method) filter.method = method;
    if (dateFromStr) filter.dateFrom = new Date(dateFromStr);
    if (dateToStr) filter.dateTo = new Date(dateToStr);

    const result = await adminService.getPayments(filter);

    res.json(result);
  } catch (error) {
    console.error('Error loading payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load payments'
    });
  }
});

// API endpoint for API logs
router.get('/api/logs', async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const method = req.query['method'] as string;
    const url = req.query['url'] as string;
    const status = parseInt(req.query['status'] as string);
    const dateFromStr = req.query['dateFrom'] as string;
    const dateToStr = req.query['dateTo'] as string;

    const filter: any = {
      page,
      limit: 50
    };

    if (method) filter.method = method;
    if (url) filter.url = url;
    if (status) filter.status = status;
    if (dateFromStr) filter.dateFrom = new Date(dateFromStr);
    if (dateToStr) filter.dateTo = new Date(dateToStr);

    const result = await adminService.getApiLogs(filter);

    res.json(result);
  } catch (error) {
    console.error('Error loading API logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load API logs'
    });
  }
});

// API endpoint for payment logs
router.get('/api/payment-logs', async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const paymentId = req.query['paymentId'] as string;
    const action = req.query['action'] as string;
    const dateFromStr = req.query['dateFrom'] as string;
    const dateToStr = req.query['dateTo'] as string;

    const filter: any = {
      page,
      limit: 50
    };

    if (paymentId) filter.paymentId = paymentId;
    if (action) filter.action = action;
    if (dateFromStr) filter.dateFrom = new Date(dateFromStr);
    if (dateToStr) filter.dateTo = new Date(dateToStr);

    const result = await adminService.getPaymentLogs(filter);

    res.json(result);
  } catch (error) {
    console.error('Error loading payment logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load payment logs'
    });
  }
});

// API endpoint for log statistics
router.get('/api/log-stats', async (req, res) => {
  try {
    const stats = await adminService.getLogStats();

    res.json(stats);
  } catch (error) {
    console.error('Error loading log stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load log statistics'
    });
  }
});

// Dashboard
router.get('/', requireAuth, async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.render('admin/dashboard', { stats });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.render('admin/dashboard', { 
      stats: {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        todayPayments: 0,
        todayAmount: 0
      }
    });
  }
});

// Lista de pagamentos
router.get('/payments', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const status = req.query['status'] as string;
    const method = req.query['method'] as string;
    const dateFromStr = req.query['dateFrom'] as string;
    const dateToStr = req.query['dateTo'] as string;

    const filter: any = {
      page,
      limit: 10
    };

    if (status) filter.status = status;
    if (method) filter.method = method;
    if (dateFromStr) filter.dateFrom = new Date(dateFromStr);
    if (dateToStr) filter.dateTo = new Date(dateToStr);

    const result = await adminService.getPayments(filter);

    res.render('admin/payments', {
      ...result,
      filters: { status, method, dateFrom: dateFromStr, dateTo: dateToStr },
      query: req.query
    });
  } catch (error) {
    console.error('Error loading payments:', error);
    res.render('admin/payments', {
      payments: [],
      total: 0,
      page: 1,
      totalPages: 1,
      filters: {},
      query: req.query
    });
  }
});

// Lista de pedidos
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const result = await adminService.getOrders(page, 10);
    
    res.render('admin/orders', result);
  } catch (error) {
    console.error('Error loading orders:', error);
    res.render('admin/orders', {
      orders: [],
      total: 0,
      page: 1,
      totalPages: 1
    });
  }
});

// Logs page
router.get('/logs', requireAuth, async (req, res) => {
  try {
    res.render('admin/logs');
  } catch (error) {
    console.error('Error loading logs page:', error);
    res.render('admin/logs');
  }
});

export default router; 