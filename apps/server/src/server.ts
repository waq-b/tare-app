import postgres from 'postgres';
import { buildApp } from './app.ts';
import { supabaseVerifierFor } from './auth/jwt.ts';
import { configFromEnv } from './config.ts';
import { migrate } from './migrate.ts';

const config = configFromEnv();
// Supabase's transaction pooler doesn't support prepared statements.
const sql = postgres(config.databaseUrl, { max: 5, prepare: false });
await migrate(sql);
const app = await buildApp({
  sql,
  verifier: supabaseVerifierFor(config.supabaseUrl),
  origins: config.origins,
  logger: true,
});
await app.listen({ host: '0.0.0.0', port: config.port });
