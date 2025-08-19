import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { logger } from '../utils/logger';
import path from 'path';

let db: Database | null = null;
let isConnected = false;

// Configuração do banco SQLite
const DB_PATH = (() => {
  // Em produção, usar diretório temporário se não conseguir criar o diretório data
  if (process.env['NODE_ENV'] === 'production') {
    try {
      const fs = require('fs');
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      return path.join(dataDir, 'paygator.db');
    } catch (error) {
      // Se não conseguir criar o diretório data, usar diretório temporário
      logger.warn('Could not create data directory, using temp directory', { error });
      return path.join(require('os').tmpdir(), 'paygator.db');
    }
  }
  
  // Em desenvolvimento, usar diretório data normal
  return path.join(process.cwd(), 'data', 'paygator.db');
})();

export const connectSQLite = async (): Promise<void> => {
  try {
    // Criar diretório data se não existir
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Abrir conexão com SQLite
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // Habilitar foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Criar tabelas se não existirem
    await createTables();
    
    isConnected = true;
    logger.info(`SQLite connected successfully at ${DB_PATH}`);
  } catch (error) {
    logger.error('Error connecting to SQLite:', error);
    throw error;
  }
};

const createTables = async (): Promise<void> => {
  if (!db) throw new Error('Database not connected');

  // Tabela de webhooks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      secret TEXT,
      provider TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de logs de webhook
  await db.exec(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webhook_id INTEGER,
      provider TEXT NOT NULL,
      payload TEXT,
      response_status INTEGER,
      response_body TEXT,
      error_message TEXT,
      processing_time INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (webhook_id) REFERENCES webhooks (id)
    )
  `);

  // Tabela de pagamentos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency TEXT DEFAULT 'MZN',
      status TEXT DEFAULT 'pending',
      customer_id TEXT,
      vendor_id TEXT,
      metadata TEXT,
      return_url TEXT,
      iframe_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de pedidos Playfood
  await db.exec(`
    CREATE TABLE IF NOT EXISTS playfood_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      customer_id TEXT,
      vendor_id TEXT,
      total_amount DECIMAL(10,2) NOT NULL,
      status TEXT NOT NULL,
      items TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de sessões de admin
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  logger.info('SQLite tables created successfully');
};

export const disconnectSQLite = async (): Promise<void> => {
  try {
    if (db) {
      await db.close();
      db = null;
    }
    isConnected = false;
    logger.info('SQLite disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from SQLite:', error);
  }
};

export const getSQLiteStatus = (): { connected: boolean; provider: string; path: string } => {
  return {
    connected: isConnected,
    provider: 'sqlite',
    path: DB_PATH
  };
};

export const getDatabase = (): Database => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectSQLite();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectSQLite();
  process.exit(0);
});

export { db }; 