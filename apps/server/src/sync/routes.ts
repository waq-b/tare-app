// Sync: the app pushes its outbox and pulls what changed since its cursor. Every query runs in
// a transaction as the `authenticated` role with the caller's claims, so RLS decides what the
// caller can see or write (not this code alone).
import type { FastifyInstance } from 'fastify';
import type { Sql, TransactionSql } from 'postgres';

export const TABLES = [
  'profile',
  'screening',
  'plans',
  'workouts',
  'sets',
  'weighIns',
  'painFlags',
] as const;
const MAX_PUSH = 500;
const MAX_PULL = 500;

export interface Change {
  table: (typeof TABLES)[number];
  id: string;
  record: Record<string, unknown> & { id: string; updatedAt: number; deleted?: boolean };
}

/** Runs `fn` as the caller, under RLS. */
export function asUser<T>(
  sql: Sql,
  userId: string,
  email: string,
  fn: (tx: TransactionSql) => Promise<T>,
) {
  return sql.begin(async (tx) => {
    const claims = JSON.stringify({ sub: userId, email, role: 'authenticated' });
    await tx`select set_config('request.jwt.claims', ${claims}, true)`;
    await tx`set local role authenticated`;
    return fn(tx);
  }) as Promise<T>;
}

function validChange(c: unknown): c is Change {
  if (typeof c !== 'object' || c === null) return false;
  const x = c as Record<string, unknown>;
  const r = x['record'] as Record<string, unknown> | undefined;
  return (
    typeof x['table'] === 'string' &&
    (TABLES as readonly string[]).includes(x['table']) &&
    typeof x['id'] === 'string' &&
    x['id'].length > 0 &&
    x['id'].length <= 100 &&
    typeof r === 'object' &&
    r !== null &&
    r['id'] === x['id'] &&
    typeof r['updatedAt'] === 'number' &&
    Number.isFinite(r['updatedAt'])
  );
}

export function syncRoutes(app: FastifyInstance, sql: Sql) {
  app.post('/sync/push', async (req, reply) => {
    const user = req.allowedUser;
    if (!user) return reply.code(403).send({ error: 'not_allowed' });
    const changes = (req.body as { changes?: unknown } | undefined)?.changes;
    if (!Array.isArray(changes) || changes.length > MAX_PUSH || !changes.every(validChange)) {
      return reply.code(400).send({ error: 'bad_changes', max: MAX_PUSH });
    }
    const applied = await asUser(sql, user.userId, user.email, async (tx) => {
      let n = 0;
      for (const c of changes) {
        // Last write wins: an older copy never replaces a newer one, so replays are harmless.
        const rows = await tx`
          insert into public.records (user_id, tbl, id, updated_at, deleted, data)
          values (${user.userId}, ${c.table}, ${c.id}, ${c.record.updatedAt},
                  ${c.record.deleted === true}, ${tx.json(c.record as never)})
          on conflict (user_id, tbl, id) do update
            set updated_at = excluded.updated_at, deleted = excluded.deleted,
                data = excluded.data, seq = nextval('public.records_seq')
            where public.records.updated_at < excluded.updated_at
          returning id`;
        n += rows.length;
      }
      return n;
    });
    return { received: changes.length, applied };
  });

  app.get('/sync/pull', async (req, reply) => {
    const user = req.allowedUser;
    if (!user) return reply.code(403).send({ error: 'not_allowed' });
    const since = Number((req.query as { since?: string }).since ?? 0);
    if (!Number.isSafeInteger(since) || since < 0)
      return reply.code(400).send({ error: 'bad_cursor' });
    const rows = await asUser(
      sql,
      user.userId,
      user.email,
      (tx) => tx`
      select tbl, id, data, seq from public.records
      where seq > ${since}
      order by seq
      limit ${MAX_PULL + 1}`,
    );
    const page = rows.slice(0, MAX_PULL);
    return {
      changes: page.map((r) => ({ table: r['tbl'], id: r['id'], record: r['data'] })),
      cursor: page.length ? Number(page.at(-1)?.['seq']) : since,
      more: rows.length > MAX_PULL,
    };
  });
}
