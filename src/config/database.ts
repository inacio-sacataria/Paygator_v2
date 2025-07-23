import { supabaseService, initializeSupabase } from './supabase.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  try {
    // Initialize PostgreSQL connection
    await initializeSupabase();
    
    const connectionTest = await supabaseService.testConnection();
    
    if (connectionTest) {
      isConnected = true;
      logger.info('Supabase PostgreSQL connected successfully');
    } else {
      throw new Error('Failed to connect to Supabase PostgreSQL');
    }
  } catch (error) {
    logger.error('Error connecting to Supabase PostgreSQL:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    // Supabase client doesn't need explicit disconnection
    isConnected = false;
    logger.info('Supabase disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from Supabase:', error);
  }
};

// Handle Supabase connection events
export const getDatabaseStatus = (): { connected: boolean; provider: string } => {
  return {
    connected: isConnected,
    provider: 'supabase'
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

// Export Supabase service for use in other modules
export { supabaseService }; 