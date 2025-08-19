import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';
import { correlationIdMiddleware, requestLoggingMiddleware, errorLoggingMiddleware } from './middleware/logging';
import { apiRateLimiter } from './middleware/rateLimiting';
import { viewsMiddleware } from './middleware/viewsMiddleware';
import webhookRoutes from './routes/webhookRoutes';
import playfoodRoutes from './routes/playfoodRoutes';
import paymentRoutes from './routes/paymentRoutes';
import playfoodPaymentRoutes from './routes/playfoodPaymentRoutes';
import paymentFormRoutes from './routes/paymentFormRoutes';
import path from 'path';
import session from 'express-session';
import bodyParser from 'body-parser';
import adminRoutes from './routes/adminRoutes';

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Paygator Webhook API',
      version: '1.0.0',
      description: 'API REST para integração de webhooks de provedores de pagamento - Clone do PlayFood',
      contact: {
        name: 'Paygator Team',
        email: 'support@paygator.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Middleware customizado para CSP - desabilitar para payment-form
    this.app.use((req, res, next) => {
      // Desabilitar CSP completamente para rotas de payment-form
      if (req.path.startsWith('/payment-form')) {
        return next();
      }
      
      // Aplicar helmet com CSP para outras rotas
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            formAction: ["'self'"],
          },
        },
      })(req, res, next);
    });

    // CORS
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      methods: config.cors.allowedMethods,
      allowedHeaders: config.cors.allowedHeaders,
      credentials: true
    }));

    // Compressão
    this.app.use(compression());

    // Parsing de JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Middlewares de logging
    this.app.use(correlationIdMiddleware);
    this.app.use(requestLoggingMiddleware);
    
    // Middleware para gerenciar views em produção
    this.app.use(viewsMiddleware);

    // Rate limiting global
    this.app.use(apiRateLimiter);

    // Configurar EJS
    this.app.set('view engine', 'ejs');
    
    // Determinar o diretório de views baseado no ambiente
    let viewsPath;
    if (process.env['NODE_ENV'] === 'production') {
      // EM PRODUÇÃO: FORÇAR USO DO DIRETÓRIO DIST
      const distViewsPath = path.join(process.cwd(), 'dist', 'src', 'views');
      const srcViewsPath = path.join(process.cwd(), 'src', 'views');
      
      logger.info('Production environment detected - forcing dist directory', { 
        cwd: process.cwd(), 
        __dirname: __dirname,
        distViewsPath,
        srcViewsPath
      });
      
      // Verificar se dist/src/views existe
      if (require('fs').existsSync(distViewsPath)) {
        viewsPath = distViewsPath;
        logger.info('Using dist/src/views directory in production', { path: distViewsPath });
      } else {
        // Se não existir, copiar do src para dist
        logger.warn('dist/src/views not found, copying from src to dist');
        
        try {
          // Criar diretório dist/src se não existir
          const distSrcDir = path.dirname(distViewsPath);
          if (!require('fs').existsSync(distSrcDir)) {
            require('fs').mkdirSync(distSrcDir, { recursive: true });
            logger.info('Created dist/src directory', { path: distSrcDir });
          }
          
          // Copiar views do src para dist
          if (require('fs').existsSync(srcViewsPath)) {
            require('fs').copyFileSync(srcViewsPath, distViewsPath);
            logger.info('Copied views from src to dist', { 
              from: srcViewsPath, 
              to: distViewsPath 
            });
            viewsPath = distViewsPath;
          } else {
            // Se src também não existir, criar diretório vazio
            require('fs').mkdirSync(distViewsPath, { recursive: true });
            logger.warn('Created empty dist/src/views directory', { path: distViewsPath });
            viewsPath = distViewsPath;
          }
        } catch (error) {
          logger.error('Failed to setup dist directory, falling back to src', { error });
          viewsPath = srcViewsPath;
        }
      }
    } else {
      // Em desenvolvimento, usar src/views
      viewsPath = path.join(process.cwd(), 'src', 'views');
    }
    
    logger.info('Views directory configuration', {
      viewsPath,
      exists: require('fs').existsSync(viewsPath),
      nodeEnv: process.env['NODE_ENV'],
      cwd: process.cwd(),
      __dirname: __dirname
    });
    
    this.app.set('views', viewsPath);

    // Configurar arquivos estáticos
    if (process.env['NODE_ENV'] === 'production') {
      // Em produção, tentar dist/public primeiro
      const distPublicPath = path.join(process.cwd(), 'dist', 'public');
      if (require('fs').existsSync(distPublicPath)) {
        this.app.use('/js', express.static(path.join(distPublicPath, 'js')));
        this.app.use('/css', express.static(path.join(distPublicPath, 'css')));
        this.app.use('/images', express.static(path.join(distPublicPath, 'images')));
        logger.info('Using dist/public for static files in production');
      } else {
        // Fallback para public normal
        this.app.use('/js', express.static(path.join(process.cwd(), 'public', 'js')));
        this.app.use('/css', express.static(path.join(process.cwd(), 'public', 'css')));
        this.app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));
        logger.warn('Using public directory for static files in production (dist/public not found)');
      }
    } else {
      // Em desenvolvimento, usar public normal
      this.app.use('/js', express.static(path.join(process.cwd(), 'public', 'js')));
      this.app.use('/css', express.static(path.join(process.cwd(), 'public', 'css')));
      this.app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));
    }

    // Body parser para forms
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());

    // Sessões para autenticação admin
    this.app.use(session({
      secret: process.env['SESSION_SECRET'] || 'paygator-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false } // true se usar HTTPS
    }));
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.server.nodeEnv,
          version: '1.0.0'
        },
        message: 'Service is healthy',
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'health_check'
      });
    });

    // Swagger documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Rotas admin (deve vir ANTES das rotas API com wildcard)
    this.app.use('/admin', adminRoutes);

    // API routes - Webhooks genéricos
    this.app.use(`/api/${config.server.apiVersion}/webhooks`, webhookRoutes);

    // API routes - PlayFood específico
    this.app.use(`/api/${config.server.apiVersion}/playfood`, playfoodRoutes);

    // API routes - Pagamentos
    this.app.use(`/api/${config.server.apiVersion}/payments`, paymentRoutes);

    // Rotas para formulário de pagamento interno
    this.app.use('/payment-form', paymentFormRoutes);

    // API routes - PlayFood Payment Provider (API completa)
    this.app.use(`/api/${config.server.apiVersion}`, playfoodPaymentRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        data: null,
        message: 'Endpoint not found',
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'not_found'
      });
    });
  }

  private initializeErrorHandling(): void {
    // Error handling middleware
    this.app.use(errorLoggingMiddleware);
  }

  public async start(): Promise<void> {
    try {
      // Conectar ao SQLite
      try {
        await connectDatabase();
        logger.info('SQLite connected successfully');
      } catch (error) {
        logger.warn('SQLite connection failed, continuing without database', { error: error instanceof Error ? error.message : 'Unknown error' });
      }

      // Iniciar servidor
      this.app.listen(config.server.port, '0.0.0.0', () => {
        logger.info('Server started successfully', {
          port: config.server.port,
          environment: config.server.nodeEnv,
          apiVersion: config.server.apiVersion,
          host: '0.0.0.0'
        });
        logger.info(`Swagger documentation available at http://localhost:${config.server.port}/api-docs`);
        logger.info(`Health check available at http://localhost:${config.server.port}/health`);
      });

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('Received shutdown signal, starting graceful shutdown...');

    try {
      // Desconectar do SQLite
      await disconnectDatabase();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    }
  }
}

export default App; 