// A throwaway Postgres database per test file: the Supabase shim, then the real migrations.
// Locally this uses the Postgres on localhost; CI runs a Postgres service container.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres, { type Sql } from 'postgres';
import { migrate } from '../src/migrate.ts';

const ADMIN = process.env['TEST_DATABASE_URL'] ?? 'postgres://localhost:5432/postgres';
const shim = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'supabase-shim.sql'),
  'utf8',
);

export async function testDatabase(): Promise<{ sql: Sql; drop: () => Promise<void> }> {
  const name = `tare_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const admin = postgres(ADMIN, { max: 1, onnotice: () => {} });
  await admin.unsafe(`create database ${name}`);
  const url = new URL(ADMIN);
  url.pathname = `/${name}`;
  const sql = postgres(url.toString(), { max: 4, onnotice: () => {} });
  await sql.unsafe(shim);
  await migrate(sql);
  return {
    sql,
    drop: async () => {
      await sql.end();
      await admin.unsafe(`drop database if exists ${name}`);
      await admin.end();
    },
  };
}
