/**
 * Facade: usa Postgres (Supabase) se DATABASE_URL estiver definida, senão SQLite.
 * Importar dataService em vez de sqliteService em toda a app.
 */
import { isDbConfigured } from '../config/db';
import { sqliteService } from './sqliteService';
import { postgresDataService } from './postgresDataService';

export type DataService = typeof sqliteService;

export const dataService: DataService = isDbConfigured() ? postgresDataService : sqliteService;

// Re-export types from sqliteService for consumers
export type {
  Webhook,
  WebhookLog,
  Payment,
  PlayfoodOrder,
  Vendor,
  VendorPayout,
} from './sqliteService';
