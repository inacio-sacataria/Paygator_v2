/**
 * PostgreSQL com Postgres.js (https://supabase.com/docs/guides/database/postgres-js)
 * Usa DATABASE_URL ou constrói a partir de SUPABASE_*.
 */
import postgres from 'postgres';
import { logger } from '../utils/logger';

function getConnectionString(): string | undefined {
  const url = process.env['DATABASE_URL'];
  if (url) return url;
  const host = process.env['SUPABASE_HOST'];
  const password = process.env['SUPABASE_PASSWORD'];
  if (host && password) {
    const port = process.env['SUPABASE_PORT'] || '5432';
    const database = process.env['SUPABASE_DATABASE'] || 'postgres';
    const user = process.env['SUPABASE_USER'] || 'postgres';
    const enc = encodeURIComponent;
    return `postgresql://${enc(user)}:${enc(password)}@${host}:${port}/${database}`;
  }
  return undefined;
}

const connectionString = getConnectionString();

export const sql = connectionString
  ? postgres(connectionString, {
      ssl: 'require',
      max: 10,
      connect_timeout: 15,
      onnotice: () => {},
    })
  : (null as unknown as ReturnType<typeof postgres>);

export function isDbConfigured(): boolean {
  return Boolean(connectionString);
}

export async function testConnection(): Promise<boolean> {
  if (!sql) {
    logger.warn('PostgreSQL: DATABASE_URL (ou SUPABASE_*) não definida');
    return false;
  }
  try {
    const result = await sql`SELECT NOW() as now`;
    logger.info('PostgreSQL (postgres.js) conectado', { now: result[0]?.['now'] });
    return true;
  } catch (err) {
    logger.warn('PostgreSQL connection test failed', { error: err instanceof Error ? err.message : err });
    return false;
  }
}
