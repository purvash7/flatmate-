import 'dotenv/config';
import http from 'http';
import { initializePostgresPersistence } from './server/postgresPersistence.ts';

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

(async () => {
  await initializePostgresPersistence();
  await import('./server.ts');
})().catch((error) => {
  console.error('FlatMate+ failed to initialize PostgreSQL:', error);
  process.exit(1);
});
