import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { logger } from '../utils/logger';

export const viewsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Apenas aplicar para rotas de payment-form
  if (req.path.startsWith('/payment-form')) {
    // Em produção, forçar o diretório de views correto
    if (process.env['NODE_ENV'] === 'production') {
      const distViewsPath = path.join(process.cwd(), 'dist', 'src', 'views');
      
      // Verificar se o diretório existe
      if (require('fs').existsSync(distViewsPath)) {
        // Configurar o diretório de views para esta rota
        req.app.set('views', distViewsPath);
        logger.info('Views directory set for payment-form route', { 
          path: distViewsPath,
          route: req.path 
        });
      } else {
        logger.error('dist/src/views directory not found in production', { 
          cwd: process.cwd(),
          distViewsPath 
        });
      }
    }
  }
  
  next();
};
