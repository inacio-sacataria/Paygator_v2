import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect('mongodb+srv://inaciosacataria:d0nt2025D0drugs@cluster.mongodb.net/paygator?retryWrites=true&w=majority', {
      dbName: 'paygator',
    });
    
    
    
    logger.info('MongoDB connected successfully', {
      database: config.database.dbName,
      uri: config.database.uri.replace(/\/\/.*@/, '//***:***@') // Hide credentials in logs
    });
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
}); 