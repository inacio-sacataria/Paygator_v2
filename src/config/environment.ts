import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env['PORT'] || '3000', 10),
    nodeEnv: process.env['NODE_ENV'] || 'development',
    apiVersion: process.env['API_VERSION'] || 'v1',
    baseUrl: (() => {
      // Se BASE_URL está definido explicitamente, use-o
      if (process.env['BASE_URL']) {
        return process.env['BASE_URL'];
      }
      
      // Em produção, tente detectar automaticamente
      if (process.env['NODE_ENV'] === 'production') {
        // Render
        if (process.env['RENDER_EXTERNAL_HOSTNAME']) {
          return `https://${process.env['RENDER_EXTERNAL_HOSTNAME']}`;
        }
        
        // Heroku
        if (process.env['HEROKU_APP_NAME']) {
          return `https://${process.env['HEROKU_APP_NAME']}.herokuapp.com`;
        }
        
        // Railway
        if (process.env['RAILWAY_STATIC_URL']) {
          return process.env['RAILWAY_STATIC_URL'];
        }
        
        // Vercel
        if (process.env['VERCEL_URL']) {
          return `https://${process.env['VERCEL_URL']}`;
        }
        
        // Fallback para produção
        return 'https://your-app.onrender.com';
      }
      
      // Desenvolvimento local
      return `http://localhost:${parseInt(process.env['PORT'] || '3000', 10)}`;
    })(),
  },
  security: {
    webhookSecret: process.env['WEBHOOK_SECRET'] || '1a02aa5907a7bc447b392f07548cf2a0f7713be742787327e4c4302c6960ee24',
    // Support multiple API keys
    apiKeys: [
      process.env['API_KEY'] || 'main_4c614d6eb046010889a8eaba36efc8e930c9656e9a4f6c553ca9cc667b267e1e',
      process.env['PLAYFOOD_API_KEY'] || 'playfood_18414ed9a7e6696a91081d51c25895c32bfa9483bd959ae5',
      // User's new API key
      'main_70a3ae2d414936451d05d19f7ca4b01c1761ee04b519b93961f56fa2a27cc914',
      // Keep backward compatibility
      process.env['API_KEY_SECRET'] || 'default-api-key-secret'
    ].filter(Boolean), // Remove empty values
    jwtSecret: process.env['JWT_SECRET'] || 'default-jwt-secret',
  },
  database: {
    // MongoDB configuration (legacy)
    uri: process.env['MONGODB_URI'] || 'mongodb+srv://inaciosacataria:d0nt2025D0drugs@cluster.mongodb.net/paygator?retryWrites=true&w=majority',
    dbName: process.env['MONGODB_DB_NAME'] || 'paygator',
    // Supabase configuration
    supabase: {
      url: process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://yrnaggnrbgetralcevqi.supabase.co',
      anonKey: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybmFnZ25yYmdldHJhbGNldnFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NjExNjYsImV4cCI6MjA2NDQzNzE2Nn0.H7JdfyRK1-AFH0fn_rKa5nE2GurqH9O38JXBHXuyJyQ',
      // PostgreSQL connection string
      postgresUrl: process.env['DATABASE_URL'] || 'postgresql://postgres:.7K8.PfQWJH@#-d@db.llrcdfutvjrrccgytbjh.supabase.co:5432/postgres',
    },
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
    allowedOrigins: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    allowedMethods: process.env['ALLOWED_METHODS']?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: process.env['ALLOWED_HEADERS']?.split(',') || ['Content-Type', 'Authorization', 'X-API-Key', 'X-Webhook-Signature', 'X-Requested-With'],
  },
  external: {
    paymentProviderUrl: process.env['PAYMENT_PROVIDER_URL'],
    paymentProviderApiKey: process.env['PAYMENT_PROVIDER_API_KEY'],
  },
  // E2Payments Configuration (Emola)
  e2payments: {
    clientId: process.env['E2PAYMENTS_CLIENT_ID'] || '',
    clientSecret: process.env['E2PAYMENTS_CLIENT_SECRET'] || '',
    authUrl: process.env['E2PAYMENTS_AUTH_URL'] || 'https://mpesaemolatech.com', // URL para autenticação (token)
    apiUrl: process.env['E2PAYMENTS_API_URL'] || 'https://mpesaemolatech.com', // URL para transações
    emolaWallet: process.env['E2PAYMENTS_EMOLA_WALLET'] || '',
  },
  // TheCode Configuration (M-Pesa)
  thecode: {
    clientId: process.env['THECODE_CLIENT_ID'] || '',
    clientSecret: process.env['THECODE_CLIENT_SECRET'] || '',
    authUrl: process.env['E2PAYMENTS_AUTH_URL'] || 'https://mpesaemolatech.com', // URL para autenticação (token)
    apiUrl: process.env['E2PAYMENTS_API_URL'] || 'https://mpesaemolatech.com', // URL para transações
    mpesaWallet: process.env['THECODE_MPESA_WALLET'] || '',
  },
} as const; 