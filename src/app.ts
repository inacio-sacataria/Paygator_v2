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
    
    // Configurar múltiplos diretórios de views (ordem de prioridade)
    const possibleViewDirs = [
      path.join(process.cwd(), 'dist', 'src', 'views'),
      path.join(process.cwd(), 'src', 'views'),
      path.join(process.cwd(), 'views'),
      path.join(__dirname, 'views'),
      path.join(__dirname, '..', 'src', 'views')
    ];

    // Logar quais diretórios existem para facilitar debug em produção
    const viewDirsWithExistence = possibleViewDirs.map((dir) => ({ dir, exists: require('fs').existsSync(dir) }));
    logger.info('Views directories (priority order)', {
      nodeEnv: process.env['NODE_ENV'],
      cwd: process.cwd(),
      __dirname: __dirname,
      candidates: viewDirsWithExistence
    });

    // Express aceita um array de diretórios em 'views'
    this.app.set('views', possibleViewDirs);

    // Configurar arquivos estáticos
    logger.info('Configurando arquivos estáticos...', {
      nodeEnv: process.env['NODE_ENV'],
      cwd: process.cwd()
    });
    
    // Função para configurar static files com fallbacks e MIME types corretos
    const setupStaticFiles = (basePath: string, label: string) => {
      logger.info(`Configurando static files para ${label}:`, basePath);
      
      if (require('fs').existsSync(basePath)) {
        // Middleware geral para public com MIME types corretos
        this.app.use(express.static(basePath, {
          setHeaders: (res, filePath) => {
            // Configurar MIME types corretos
            if (filePath.endsWith('.js')) {
              res.setHeader('Content-Type', 'application/javascript');
              res.setHeader('Cache-Control', 'public, max-age=3600');
            } else if (filePath.endsWith('.css')) {
              res.setHeader('Content-Type', 'text/css');
              res.setHeader('Cache-Control', 'public, max-age=3600');
            }
          }
        }));
        
        // Middlewares específicos para evitar conflitos
        this.app.use('/js', express.static(path.join(basePath, 'js'), {
          setHeaders: (res, filePath) => {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'public, max-age=3600');
          }
        }));
        this.app.use('/css', express.static(path.join(basePath, 'css'), {
          setHeaders: (res, filePath) => {
            res.setHeader('Content-Type', 'text/css');
            res.setHeader('Cache-Control', 'public, max-age=3600');
          }
        }));
        this.app.use('/images', express.static(path.join(basePath, 'images')));
        
        logger.info(`✅ Static files configurados para ${label}:`, basePath);
        return true;
      } else {
        logger.warn(`❌ Diretório não encontrado para ${label}:`, basePath);
        return false;
      }
    };
    
    if (process.env['NODE_ENV'] === 'production') {
      // Em produção, tentar múltiplos caminhos
      const possiblePaths = [
        path.join(process.cwd(), 'dist', 'public'),
        path.join(process.cwd(), 'public'),
        path.join(__dirname, '..', 'public'),
        path.join(__dirname, '..', '..', 'public'),
        path.join(process.cwd(), 'src', 'public')
      ];
      
      let staticFilesConfigured = false;
      
      for (const staticPath of possiblePaths) {
        if (setupStaticFiles(staticPath, `production path: ${staticPath}`)) {
          staticFilesConfigured = true;
          break;
        }
      }
      
      if (!staticFilesConfigured) {
        logger.error('❌ Nenhum diretório de static files encontrado em produção!');
        logger.error('Caminhos tentados:', possiblePaths);
      }
    } else {
      // Em desenvolvimento, usar public normal
      setupStaticFiles(path.join(process.cwd(), 'public'), 'development');
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

    // Debug route para testar arquivos estáticos
    this.app.get('/debug/static', (req, res) => {
      const fs = require('fs');
      const path = require('path');
      
      const publicPath = path.join(process.cwd(), 'public');
      const distPublicPath = path.join(process.cwd(), 'dist', 'public');
      
      const publicExists = fs.existsSync(publicPath);
      const distPublicExists = fs.existsSync(distPublicPath);
      
      const publicFiles = publicExists ? fs.readdirSync(publicPath) : [];
      const distPublicFiles = distPublicExists ? fs.readdirSync(distPublicPath) : [];
      
      res.status(200).json({
        success: true,
        data: {
          public: {
            exists: publicExists,
            path: publicPath,
            files: publicFiles
          },
          distPublic: {
            exists: distPublicExists,
            path: distPublicPath,
            files: distPublicFiles
          },
          nodeEnv: process.env['NODE_ENV'],
          cwd: process.cwd(),
          __dirname: __dirname
        },
        message: 'Static files debug information',
        timestamp: new Date().toISOString(),
        correlation_id: req.headers['x-correlation-id'] || 'debug_static'
      });
    });

    // Fallback route para servir JavaScript files com MIME type correto
    this.app.get('/js/:filename', (req, res) => {
      const fs = require('fs');
      const path = require('path');
      
      const filename = req.params.filename;
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'js', filename),
        path.join(process.cwd(), 'dist', 'public', 'js', filename),
        path.join(__dirname, '..', 'public', 'js', filename),
        path.join(__dirname, '..', '..', 'public', 'js', filename)
      ];
      
      let fileFound = false;
      
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          logger.info(`Serving JavaScript file via fallback route: ${filePath}`);
          
          // Configurar MIME type correto
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          
          // Servir o arquivo
          res.sendFile(filePath);
          fileFound = true;
          break;
        }
      }
      
      if (!fileFound) {
        logger.warn(`JavaScript file not found: ${filename}`, {
          searchedPaths: possiblePaths,
          cwd: process.cwd(),
          __dirname: __dirname
        });
        res.status(404).json({
          success: false,
          message: 'JavaScript file not found',
          filename: filename,
          searchedPaths: possiblePaths
        });
      }
    });

    // Fallback route para servir CSS files com MIME type correto
    this.app.get('/css/:filename', (req, res) => {
      const fs = require('fs');
      const path = require('path');
      
      const filename = req.params.filename;
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'css', filename),
        path.join(process.cwd(), 'dist', 'public', 'css', filename),
        path.join(__dirname, '..', 'public', 'css', filename),
        path.join(__dirname, '..', '..', 'public', 'css', filename)
      ];
      
      let fileFound = false;
      
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          logger.info(`Serving CSS file via fallback route: ${filePath}`);
          
          // Configurar MIME type correto
          res.setHeader('Content-Type', 'text/css');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          
          // Servir o arquivo
          res.sendFile(filePath);
          fileFound = true;
          break;
        }
      }
      
      if (!fileFound) {
        logger.warn(`CSS file not found: ${filename}`, {
          searchedPaths: possiblePaths,
          cwd: process.cwd(),
          __dirname: __dirname
        });
        res.status(404).json({
          success: false,
          message: 'CSS file not found',
          filename: filename,
          searchedPaths: possiblePaths
        });
      }
    });

    // Test route para verificar se arquivos estáticos estão funcionando
    this.app.get('/test-static/:type/:filename', (req, res) => {
      const fs = require('fs');
      const path = require('path');
      
      const { type, filename } = req.params;
      const possiblePaths = [
        path.join(process.cwd(), 'public', type, filename),
        path.join(process.cwd(), 'dist', 'public', type, filename),
        path.join(__dirname, '..', 'public', type, filename),
        path.join(__dirname, '..', '..', 'public', type, filename)
      ];
      
      logger.info(`Testing static file access for ${type}/${filename}`, {
        possiblePaths,
        cwd: process.cwd(),
        __dirname: __dirname
      });
      
      let fileFound = false;
      
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          logger.info(`File found at: ${filePath}`);
          
          // Configurar MIME type correto
          if (type === 'js') {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (type === 'css') {
            res.setHeader('Content-Type', 'text/css');
          }
          
          res.setHeader('Cache-Control', 'public, max-age=3600');
          
          // Servir o arquivo
          res.sendFile(filePath);
          fileFound = true;
          break;
        }
      }
      
      if (!fileFound) {
        logger.warn(`Static file not found: ${type}/${filename}`, {
          searchedPaths: possiblePaths,
          cwd: process.cwd(),
          __dirname: __dirname
        });
        res.status(404).json({
          success: false,
          message: 'Static file not found',
          file: `${type}/${filename}`,
          searchedPaths: possiblePaths,
          cwd: process.cwd(),
          __dirname: __dirname
        });
      }
    });

    // Route para listar todos os arquivos disponíveis
    this.app.get('/list-files', (req, res) => {
      const fs = require('fs');
      const path = require('path');
      
      const possiblePaths = [
        path.join(process.cwd(), 'public'),
        path.join(process.cwd(), 'dist', 'public'),
        path.join(__dirname, '..', 'public'),
        path.join(__dirname, '..', '..', 'public')
      ];
      
      const fileList: Record<string, string[] | string> = {};
      
      possiblePaths.forEach(dirPath => {
        if (fs.existsSync(dirPath)) {
          try {
            const listDirectory = (dir: string, prefix = ''): string[] => {
              const items = fs.readdirSync(dir);
              const files: string[] = [];
              
              items.forEach((item: string) => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                  files.push(`${prefix}${item}/`);
                  listDirectory(fullPath, prefix + '  ');
                } else {
                  files.push(`${prefix}${item}`);
                }
              });
              
              return files;
            };
            
            fileList[dirPath] = listDirectory(dirPath);
          } catch (error) {
            fileList[dirPath] = `Error reading directory: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        } else {
          fileList[dirPath] = 'Directory does not exist';
        }
      });
      
      res.status(200).json({
        success: true,
        data: {
          fileList,
          cwd: process.cwd(),
          __dirname: __dirname,
          nodeEnv: process.env['NODE_ENV']
        },
        message: 'File listing for debugging',
        timestamp: new Date().toISOString()
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