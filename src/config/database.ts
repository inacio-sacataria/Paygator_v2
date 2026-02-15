import { connectSQLite, disconnectSQLite, getSQLiteStatus, getDatabase } from './sqlite';
import { isDbConfigured, testConnection } from './db';
import { logger } from '../utils/logger';

async function initSupabaseDataTablesIfNeeded(): Promise<void> {
  try {
    const { initSupabaseDataTables } = await import('../services/postgresDataService');
    await initSupabaseDataTables();
  } catch (err) {
    logger.warn('Could not init Supabase data tables', { error: err instanceof Error ? err.message : err });
  }
}

let isConnected = false;
let usingPostgres = false;

export const connectDatabase = async (): Promise<void> => {
  try {
    if (isDbConfigured()) {
      const ok = await testConnection();
      if (!ok) throw new Error('PostgreSQL connection failed');
      await initSupabaseDataTablesIfNeeded();
      usingPostgres = true;
      isConnected = true;
      logger.info('PostgreSQL (Supabase) connected successfully');
    } else {
      await connectSQLite();
      isConnected = true;
      logger.info('SQLite connected successfully');
    }
  } catch (error) {
    logger.error('Error connecting to database:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (!usingPostgres) await disconnectSQLite();
    isConnected = false;
    usingPostgres = false;
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};

export const getDatabaseStatus = (): { connected: boolean; provider: string; path?: string } => {
  if (usingPostgres) {
    return { connected: isConnected, provider: 'postgres' };
  }
  const status = getSQLiteStatus();
  return {
    connected: isConnected && status.connected,
    provider: 'sqlite',
    path: status.path
  };
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

// Export SQLite database for use in other modules
export { getDatabase }; 