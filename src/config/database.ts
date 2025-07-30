import { connectSQLite, disconnectSQLite, getSQLiteStatus, getDatabase } from './sqlite';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  try {
    // Initialize SQLite connection
    await connectSQLite();
    
    isConnected = true;
    logger.info('SQLite connected successfully');
  } catch (error) {
    logger.error('Error connecting to SQLite:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await disconnectSQLite();
    isConnected = false;
    logger.info('SQLite disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from SQLite:', error);
  }
};

// Handle SQLite connection events
export const getDatabaseStatus = (): { connected: boolean; provider: string; path?: string } => {
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