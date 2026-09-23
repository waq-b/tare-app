// Applies migrations/*.sql in order, once each (recorded in public.migrations).
//   DATABASE_URL=... npm run migrate -w @tare/server
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres, { type Sql } from 'postgres';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../migrations');

export async function migrate(sql: Sql): Promise<string[]> {
  await sql`create table if not exists public.migrations (name text primary key, applied_at timestamptz not null default now())`;
  // Bookkeeping only: RLS on with no policies, and no grants, so the app roles can't see it.
  await sql`alter table public.migrations enable row level security`;
  await sql`revoke all on public.migrations from public`;
  const done = new Set(
    (await sql`select name from public.migrations`).map((r) => r['name'] as string),
  );
  const applied: string[] = [];
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    if (done.has(file)) continue;
    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(join(dir, file), 'utf8'));
      await tx`insert into public.migrations (name) values (${file})`;
    });
    applied.push(file);
  }
  return applied;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is not set');
  const sql = postgres(url, { max: 1 });
  const applied = await migrate(sql);
  console.log(applied.length ? `applied: ${applied.join(', ')}` : 'up to date');
  await sql.end();
}
