import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env['PORT'] || '3000', 10),
    nodeEnv: process.env['NODE_ENV'] || 'development',
    apiVersion: process.env['API_VERSION'] || 'v1',
  },
  security: {
    webhookSecret: process.env['WEBHOOK_SECRET'] || 'default-secret-change-in-production',
    apiKeySecret: process.env['API_KEY_SECRET'] || 'default-api-key-secret',
    jwtSecret: process.env['JWT_SECRET'] || 'default-jwt-secret',
  },
  database: {
    uri: process.env['MONGODB_URI'] || 'mongodb+srv://inaciosacataria:d0nt2025D0drugs@cluster.mongodb.net/paygator?retryWrites=true&w=majority',
    dbName: process.env['MONGODB_DB_NAME'] || 'paygator',
  },
  redis: {
    url: process.env['REDIS_URL'] || 'redis://localhost:6379',
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'],
  },
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
    filePath: process.env['LOG_FILE_PATH'] || 'logs/app.log',
  },
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10),
    maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),
  },
  webhook: {
    timeoutMs: parseInt(process.env['WEBHOOK_TIMEOUT_MS'] || '30000', 10),
    retryAttempts: parseInt(process.env['WEBHOOK_RETRY_ATTEMPTS'] || '3', 10),
    retryDelayMs: parseInt(process.env['WEBHOOK_RETRY_DELAY_MS'] || '5000', 10),
  },
  monitoring: {
    enableMetrics: process.env['ENABLE_METRICS'] === 'true',
    metricsPort: parseInt(process.env['METRICS_PORT'] || '9090', 10),
  },
  cors: {
    allowedOrigins: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
    allowedMethods: process.env['ALLOWED_METHODS']?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: process.env['ALLOWED_HEADERS']?.split(',') || ['Content-Type', 'Authorization', 'X-API-Key', 'X-Webhook-Signature'],
  },
  external: {
    paymentProviderUrl: process.env['PAYMENT_PROVIDER_URL'],
    paymentProviderApiKey: process.env['PAYMENT_PROVIDER_API_KEY'],
  },
} as const; 