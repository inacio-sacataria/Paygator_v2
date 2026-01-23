import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { adminService } from '../services/adminService';
import { logger } from '../utils/logger';
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
  try {
    console.log('[LOGIN] Route called', {
      method: req.method,
      url: req.url,
      hasBody: !!req.body,
      body: req.body,
      hasPassword: !!req.body?.password,
      password: req.body?.password ? '***' : undefined,
      hasSession: !!req.session,
      sessionId: req.sessionID,
      headers: {
        'x-requested-with': req.headers['x-requested-with'],
        'accept': req.headers['accept'],
        'origin': req.headers['origin'],
        'content-type': req.headers['content-type']
      }
    });
    
    const { password } = req.body;
    
    if (!password) {
      const isApiRequest = req.headers['x-requested-with'] === 'XMLHttpRequest';
      if (isApiRequest) {
        return res.status(400).json({
          success: false,
          message: 'Senha é obrigatória'
        });
      }
      return res.render('admin/login', { error: 'Senha é obrigatória' });
    }
    
    // Verificar se é uma requisição da API (React) pelo header X-Requested-With
    const isApiRequest = req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                         req.headers['accept']?.includes('application/json') ||
                         req.headers['origin']?.includes('localhost:3001');
    
    console.log('[LOGIN] isApiRequest:', isApiRequest, {
      'x-requested-with': req.headers['x-requested-with'],
      'accept': req.headers['accept'],
      'origin': req.headers['origin']
    });
    
    if (password === ADMIN_PASSWORD) {
      if (req.session) {
        req.session.admin = true;
        console.log('[LOGIN] Session set to authenticated', { sessionId: req.sessionID });
      } else {
        console.error('[LOGIN] Session is null!');
      }
      
      // Se for requisição da API (React), retornar JSON
      if (isApiRequest) {
        console.log('[LOGIN] Returning JSON response for API request');
        return res.status(200).json({
          success: true,
          message: 'Login realizado com sucesso'
        });
      }
      
      // Caso contrário, redirecionar (comportamento antigo para EJS)
      return res.redirect('/admin');
    }
    
    // Se for requisição da API (React), retornar JSON de erro
    if (isApiRequest) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta!'
      });
    }
    
    // Caso contrário, renderizar página de erro (comportamento antigo para EJS)
    res.render('admin/login', { error: 'Senha incorreta!' });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Login error stack:', error?.stack);
    
    const isApiRequest = req.headers['x-requested-with'] === 'XMLHttpRequest';
    if (isApiRequest) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao processar login',
        error: process.env['NODE_ENV'] === 'development' ? error?.message : undefined
      });
    }
    
    res.status(500).render('admin/login', { error: 'Erro interno ao processar login' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.admin = false;
  }
  res.redirect('/admin/login');
});

// Rota de teste simples - DEVE VIR PRIMEIRO
router.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test route works', 
    timestamp: new Date().toISOString(),
    hasSession: !!req.session,
    sessionId: req.sessionID
  });
});

// API endpoint para verificar autenticação (deve vir ANTES de requireAuth)
// Esta rota deve ser acessível sem autenticação
router.get('/api/auth/check', (req, res) => {
  try {
    console.log('[AUTH CHECK] Route called', {
      method: req.method,
      url: req.url,
      hasSession: !!req.session,
      sessionId: req.sessionID,
      sessionAdmin: req.session?.admin
    });
    
    // Verificar se a sessão existe e se o admin está autenticado
    let isAuthenticated = false;
    
    if (req.session) {
      isAuthenticated = req.session.admin === true;
    }
    
    console.log('[AUTH CHECK] Result:', { isAuthenticated });
    
    res.status(200).json({
      authenticated: isAuthenticated
    });
  } catch (error: any) {
    console.error('[AUTH CHECK] Error:', error);
    console.error('[AUTH CHECK] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    // Sempre retornar 200 com authenticated: false em caso de erro
    res.status(200).json({
      authenticated: false,
      error: 'Error checking authentication'
    });
  }
});

// API endpoint for dashboard stats
router.get('/api/stats', requireAuth, async (req, res) => {
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
    // Passar query parameters para o template
    const paymentId = req.query['paymentId'] as string || '';
    const commissionPercentage = req.query['commissionPercentage'] as string || '';
    const vendorPhone = req.query['vendorPhone'] as string || '';
    
    const queryParams = {
      paymentId: paymentId,
      commissionPercentage: commissionPercentage,
      vendorPhone: vendorPhone
    };
    res.render('admin/dashboard', { stats, queryParams });
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
      },
      queryParams: {
        paymentId: req.query['paymentId'] as string || '',
        commissionPercentage: req.query['commissionPercentage'] as string || '',
        vendorPhone: req.query['vendorPhone'] as string || ''
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