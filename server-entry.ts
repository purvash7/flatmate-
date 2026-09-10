import 'dotenv/config';
import http from 'http';
import { initializePostgresPersistence, persistSnapshot } from './server/postgresPersistence.ts';
import { pool } from './src/db/index.ts';

// server.ts currently uses a local default port (3000). Render supplies the
// actual public port through PORT, so translate that listen call at startup
// without changing the existing server implementation.
const originalListen = http.Server.prototype.listen;
http.Server.prototype.listen = function (...args: any[]) {
  if (process.env.PORT && Number.isFinite(Number(process.env.PORT)) && args[0] === 3000) {
    args[0] = Number(process.env.PORT);
  }
  return originalListen.apply(this, args as any);
};

let shuttingDown = false;
const gracefulShutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`FlatMate+ received ${signal}; flushing application data to PostgreSQL...`);
  try {
    await persistSnapshot();
    console.log('PostgreSQL shutdown flush completed.');
  } catch (error) {
    console.error('PostgreSQL shutdown flush failed:', error);
  } finally {
    await pool.end().catch(() => undefined);
    process.exit(0);
  }
};

process.once('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => void gracefulShutdown('SIGINT'));

(async () => {
  await initializePostgresPersistence();
  await import('./server.ts');
})().catch((error) => {
  console.error('FlatMate+ failed to initialize PostgreSQL:', error);
  process.exit(1);
});
