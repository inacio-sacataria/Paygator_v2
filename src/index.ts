import dns from 'node:dns';
// Preferir IPv4 na conexão ao Supabase (evita EHOSTUNREACH em redes sem IPv6)
dns.setDefaultResultOrder('ipv4first');

import App from './app';
import { logger } from './utils/logger';

const app = new App();

app.start().catch((error) => {
  logger.error('Failed to start application', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
}); 