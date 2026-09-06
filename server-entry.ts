import 'dotenv/config';
import { initializePostgresPersistence } from './server/postgresPersistence.ts';

(async () => {
  await initializePostgresPersistence();
  await import('./server.ts');
})().catch((error) => {
  console.error('FlatMate+ failed to initialize PostgreSQL:', error);
  process.exit(1);
});
