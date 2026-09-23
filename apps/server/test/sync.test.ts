import type { FastifyInstance } from 'fastify';
import type { Sql } from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { asUser } from '../src/sync/routes.ts';
import { testDatabase } from './db.ts';
import { ISSUER, testKeys } from './keys.ts';

const A = { id: '00000000-0000-4000-8000-00000000000a', email: 'test@example.com' };
const B = { id: '00000000-0000-4000-8000-00000000000b', email: 'friend@example.com' };

let sql: Sql;
let drop: () => Promise<void>;
let app: FastifyInstance;
let tokenA: string;
let tokenB: string;
let keys: Awaited<ReturnType<typeof testKeys>>;

beforeAll(async () => {
  ({ sql, drop } = await testDatabase());
  keys = await testKeys();
  app = await buildApp({ sql, verifier: keys.verifier, origins: ['https://tare.example.com'] });
  await sql`insert into public.allowed_users (email) values (${A.email}), (${B.email})`;
  tokenA = await keys.token(A.id, A.email);
  tokenB = await keys.token(B.id, B.email);
});
afterAll(async () => {
  await app.close();
  await drop();
});

const weighIn = (id: string, updatedAt: number, kg = 92) => ({
  table: 'weighIns',
  id,
  record: { id, updatedAt, date: '2026-09-22', time: '07:00', kg, waistCm: null },
});
const push = (token: string, changes: unknown[]) =>
  app.inject({
    method: 'POST',
    url: '/sync/push',
    headers: { authorization: `Bearer ${token}` },
    payload: { changes },
  });
const pull = (token: string, since = 0) =>
  app.inject({
    method: 'GET',
    url: `/sync/pull?since=${since}`,
    headers: { authorization: `Bearer ${token}` },
  });

describe('auth', () => {
  it('/health answers without a token', async () => {
    expect((await app.inject('/health')).json()).toEqual({ ok: true });
  });

  it('401 without a token, with rubbish, or with a token from elsewhere', async () => {
    expect((await app.inject('/sync/pull')).statusCode).toBe(401);
    expect((await pull('not-a-jwt')).statusCode).toBe(401);
    expect(
      (await pull(await keys.token(A.id, A.email, { issuer: 'https://evil.example/auth/v1' })))
        .statusCode,
    ).toBe(401);
    expect((await pull(await keys.token(A.id, A.email, { audience: 'anon' }))).statusCode).toBe(
      401,
    );
    expect((await pull(await keys.token(A.id, A.email, { expired: true }))).statusCode).toBe(401);
    expect(ISSUER).toContain('/auth/v1');
  });

  it('403 for a valid token whose email isn’t on the allowlist', async () => {
    const res = await pull(
      await keys.token('00000000-0000-4000-8000-00000000000c', 'stranger@example.com'),
    );
    expect(res.statusCode).toBe(403);
  });

  it('CORS allows the app’s origin only', async () => {
    const ok = await app.inject({
      method: 'OPTIONS',
      url: '/sync/pull',
      headers: { origin: 'https://tare.example.com', 'access-control-request-method': 'GET' },
    });
    expect(ok.headers['access-control-allow-origin']).toBe('https://tare.example.com');
    const no = await app.inject({
      method: 'OPTIONS',
      url: '/sync/pull',
      headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' },
    });
    expect(no.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('push and pull', () => {
  it('round-trips records, and the cursor only returns what’s new', async () => {
    const res = await push(tokenA, [weighIn('w-1', 100), weighIn('w-2', 100, 91.5)]);
    expect(res.json()).toEqual({ received: 2, applied: 2 });
    const all = (await pull(tokenA)).json();
    expect(all.changes.map((c: { id: string }) => c.id)).toEqual(['w-1', 'w-2']);
    expect(all.changes[1].record).toMatchObject({ id: 'w-2', kg: 91.5 });
    const none = (await pull(tokenA, all.cursor)).json();
    expect(none.changes).toEqual([]);
    expect(none.cursor).toBe(all.cursor);
  });

  it('replaying a push changes nothing (idempotent)', async () => {
    const before = (await pull(tokenA)).json().cursor;
    expect((await push(tokenA, [weighIn('w-1', 100)])).json()).toEqual({ received: 1, applied: 0 });
    expect((await pull(tokenA, before)).json().changes).toEqual([]);
  });

  it('last write wins: an older copy is ignored, a newer one replaces and comes back in a pull', async () => {
    const cursor = (await pull(tokenA)).json().cursor;
    expect((await push(tokenA, [weighIn('w-1', 50, 99)])).json().applied).toBe(0);
    expect((await push(tokenA, [weighIn('w-1', 200, 91)])).json().applied).toBe(1);
    const next = (await pull(tokenA, cursor)).json();
    expect(next.changes).toEqual([
      { table: 'weighIns', id: 'w-1', record: expect.objectContaining({ kg: 91, updatedAt: 200 }) },
    ]);
  });

  it('soft deletes sync like any other change', async () => {
    const cursor = (await pull(tokenA)).json().cursor;
    await push(tokenA, [
      { ...weighIn('w-2', 300), record: { ...weighIn('w-2', 300).record, deleted: true } },
    ]);
    const next = (await pull(tokenA, cursor)).json();
    expect(next.changes[0].record.deleted).toBe(true);
  });

  it('accepts the P1 changes table (migration 002)', async () => {
    const res = await push(tokenA, [
      { table: 'changes', id: 'c-1', record: { id: 'c-1', updatedAt: 1, kind: 'progression' } },
    ]);
    expect(res.json()).toEqual({ received: 1, applied: 1 });
  });

  it('rejects malformed batches', async () => {
    expect(
      (await push(tokenA, [{ table: 'secrets', id: 'x', record: { id: 'x', updatedAt: 1 } }]))
        .statusCode,
    ).toBe(400);
    expect(
      (await push(tokenA, [{ table: 'sets', id: 'x', record: { id: 'y', updatedAt: 1 } }]))
        .statusCode,
    ).toBe(400);
    expect((await push(tokenA, [{ table: 'sets', id: 'x', record: { id: 'x' } }])).statusCode).toBe(
      400,
    );
    expect((await pull(tokenA, -1)).statusCode).toBe(400);
  });
});

describe('one user can’t touch another’s rows (RLS)', () => {
  it('B pulls none of A’s records', async () => {
    const res = (await pull(tokenB)).json();
    expect(res.changes).toEqual([]);
  });

  it('the same record id from B is B’s own row, not A’s', async () => {
    await push(tokenB, [weighIn('w-1', 999, 70)]);
    const a = (await pull(tokenA)).json().changes.find((c: { id: string }) => c.id === 'w-1');
    expect(a.record.kg).toBe(91);
    const b = (await pull(tokenB)).json().changes;
    expect(b).toHaveLength(1);
    expect(b[0].record.kg).toBe(70);
  });

  it('Postgres itself refuses: as B, A’s rows are invisible and can’t be written', async () => {
    const seen = await asUser(
      sql,
      B.id,
      B.email,
      (tx) => tx`select count(*)::int as n from public.records where user_id = ${A.id}`,
    );
    expect(seen[0]?.['n']).toBe(0);
    await expect(
      asUser(
        sql,
        B.id,
        B.email,
        (tx) =>
          tx`insert into public.records (user_id, tbl, id, updated_at, data) values (${A.id}, 'sets', 'forged', 1, '{}')`,
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      asUser(sql, B.id, B.email, (tx) => tx`select * from public.allowed_users`),
    ).rejects.toThrow(/permission denied/);
  });
});
