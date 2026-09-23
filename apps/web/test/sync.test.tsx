import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createAppData, type AppData } from '../src/data/DbContext.tsx';
import { TareDb } from '../src/db/index.ts';
import { readStatus, squash, syncOnce } from '../src/sync/engine.ts';
import { SyncHttpError, type SyncChange, type SyncTransport } from '../src/sync/transport.ts';
import { renderApp, testProfile } from './render.tsx';

/** The API's rules in memory: last write wins per record, a global change sequence. */
function memServer() {
  const rows = new Map<string, { change: SyncChange; seq: number }>();
  let seq = 0;
  const log: SyncChange[][] = [];
  const transport: SyncTransport & {
    fail?: unknown;
    beforePush?: (() => Promise<void>) | undefined;
  } = {
    async push(changes) {
      if (transport.fail) throw transport.fail;
      await transport.beforePush?.();
      log.push(changes);
      let applied = 0;
      for (const c of changes) {
        const k = `${c.table}/${c.id}`;
        const cur = rows.get(k);
        if (cur && cur.change.record.updatedAt >= c.record.updatedAt) continue;
        rows.set(k, { change: c, seq: ++seq });
        applied++;
      }
      return { applied };
    },
    async pull(since) {
      if (transport.fail) throw transport.fail;
      const changes = [...rows.values()].filter((r) => r.seq > since).sort((a, b) => a.seq - b.seq);
      return {
        changes: changes.map((r) => r.change),
        cursor: changes.at(-1)?.seq ?? since,
        more: false,
      };
    },
  };
  return { transport, rows, log };
}

const device = () => createAppData(new TareDb(`dev-${Math.random()}`));
const setOnline = (on: boolean) =>
  Object.defineProperty(navigator, 'onLine', { value: on, configurable: true });
afterEach(() => setOnline(true));

async function logSet(d: AppData, load = 80) {
  const w = await d.r.workouts.start({
    planId: null,
    sessionKey: 'A',
    date: '2026-09-22',
    exercises: [],
  });
  const s = await d.r.sets.log({
    workoutId: w.id,
    exerciseId: 'Barbell_Squat',
    kind: 'work',
    load,
    reps: 8,
    effort: null,
  });
  await d.r.workouts.finish(w.id, 'good');
  return { w, s };
}

describe('sync', () => {
  it('offline logging stays queued, then syncs when back online', async () => {
    const server = memServer();
    const d = device();
    setOnline(false);
    await logSet(d);
    expect((await syncOnce(d.db, server.transport)).state).toBe('offline');
    expect(await d.db.outbox.count()).toBeGreaterThan(0);
    expect(server.rows.size).toBe(0);
    setOnline(true);
    const s = await syncOnce(d.db, server.transport);
    expect(s).toMatchObject({ state: 'idle', pending: 0 });
    expect(s.lastSyncedAt).not.toBeNull();
    expect([...server.rows.keys()].sort()).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^workouts\//),
        expect.stringMatching(/^sets\//),
      ]),
    );
  });

  it('sends only the latest copy of a record changed several times', async () => {
    const server = memServer();
    const d = device();
    const { w } = await logSet(d);
    await d.r.workouts.update(w.id, { feel: 'tough' });
    await syncOnce(d.db, server.transport);
    const pushed = server.log.flat().filter((c) => c.id === w.id);
    expect(pushed).toHaveLength(1);
    expect(pushed[0]?.record['feel']).toBe('tough');
  });

  it('a change made while a push is in flight is kept and sent after it', async () => {
    const server = memServer();
    const d = device();
    const { s } = await logSet(d);
    server.transport.beforePush = async () => {
      server.transport.beforePush = undefined;
      await d.r.sets.edit(s.id, { reps: 7 });
    };
    await syncOnce(d.db, server.transport);
    expect(server.log).toHaveLength(2); // the first batch, then the edit made during it
    expect(await d.db.outbox.count()).toBe(0);
    expect(server.rows.get(`sets/${s.id}`)?.change.record['reps']).toBe(7);
  });

  it('a second device pulls everything', async () => {
    const server = memServer();
    const phone = device();
    const { w, s } = await logSet(phone, 82.5);
    await phone.r.weighIns.add({ date: '2026-09-22', time: '07:00', kg: 91.4, waistCm: null });
    await syncOnce(phone.db, server.transport);
    const laptop = device();
    await syncOnce(laptop.db, server.transport);
    expect((await laptop.r.workouts.get(w.id))?.feel).toBe('good');
    expect((await laptop.r.sets.forWorkout(w.id))[0]?.load).toBe(82.5);
    expect((await laptop.r.weighIns.list())[0]?.kg).toBe(91.4);
    expect(s.id).toBeTruthy();
    // Pulled records aren't queued to go back up.
    expect(await laptop.db.outbox.count()).toBe(0);
  });

  it('conflicts: last write wins both ways', async () => {
    const server = memServer();
    const a = device();
    const b = device();
    const { s } = await logSet(a, 80);
    await syncOnce(a.db, server.transport);
    await syncOnce(b.db, server.transport);
    // B edits later (newer): it wins on A after a sync.
    await new Promise((r) => setTimeout(r, 5));
    await b.r.sets.edit(s.id, { load: 85 });
    await syncOnce(b.db, server.transport);
    await syncOnce(a.db, server.transport);
    expect((await a.db.sets.get(s.id))?.load).toBe(85);
    // An older local copy doesn't overwrite a newer pulled one, and the server keeps the newer.
    const stale = { ...(await a.db.sets.get(s.id))!, load: 70, updatedAt: 1 };
    await a.db.outbox.add({ table: 'sets', id: s.id, record: stale, queuedAt: 1 });
    await syncOnce(a.db, server.transport);
    expect(server.rows.get(`sets/${s.id}`)?.change.record['load']).toBe(85);
    expect((await a.db.sets.get(s.id))?.load).toBe(85);
  });

  it('a pulled record that doesn’t match the app’s schema is counted, not applied', async () => {
    const server = memServer();
    await server.transport.push([
      { table: 'sets', id: 'bad', record: { id: 'bad', updatedAt: 1, reps: 'eight' } },
    ]);
    const d = device();
    const s = await syncOnce(d.db, server.transport);
    expect(s.rejected).toBe(1);
    expect(await d.db.sets.get('bad')).toBeUndefined();
  });

  it.each([
    [new SyncHttpError(401), 'signin'],
    [new SyncHttpError(403), 'not_allowed'],
    [new SyncHttpError(500), 'failed'],
    [new TypeError('Failed to fetch'), 'offline'],
  ])('%s → %s, and nothing queued is lost', async (err, state) => {
    const server = memServer();
    const d = device();
    await logSet(d);
    const before = await d.db.outbox.count();
    server.transport.fail = err;
    expect((await syncOnce(d.db, server.transport)).state).toBe(state);
    expect(await d.db.outbox.count()).toBe(before);
  });

  it('squash keeps one entry per record, the newest', () => {
    const rec = (id: string, updatedAt: number) => ({
      table: 'sets' as const,
      id,
      record: { id, updatedAt } as never,
      queuedAt: 0,
    });
    expect(
      squash([rec('a', 1), rec('b', 1), rec('a', 3), rec('a', 2)]).map((e) => [
        e.id,
        e.record.updatedAt,
      ]),
    ).toEqual([
      ['a', 3],
      ['b', 1],
    ]);
  });
});

describe('a new phone or a second install', () => {
  it('after sign-in, restores from the server instead of onboarding again', async () => {
    const server = memServer();
    const first = device();
    await first.r.profile.save({ ...testProfile, onboardedAt: 1 });
    await first.r.weighIns.add({ date: '2026-09-22', time: '07:00', kg: 91.4, waistCm: null });
    await syncOnce(first.db, server.transport);

    const second = device();
    const { router } = await renderApp('/', {
      data: second,
      onboarded: false,
      transport: server.transport,
    });
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeTruthy();
    expect((await second.r.profile.get())?.onboardedAt).toBe(1);
    expect(router.state.location.pathname).not.toMatch(/onboarding/);
  });

  it('with nothing on the server, onboarding starts as normal', async () => {
    const server = memServer();
    const { router } = await renderApp('/', {
      data: device(),
      onboarded: false,
      transport: server.transport,
    });
    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding/welcome'));
  });

  it('two phones each made an active plan: the newest one is used', async () => {
    const d = device();
    const base = { name: 'Starter plan', startedOn: '2026-09-22', sessions: [] };
    const older = await d.store.put('plans', { ...base, active: true });
    await new Promise((r) => setTimeout(r, 5));
    const newer = await d.store.put('plans', { ...base, active: true });
    expect(older.id).not.toBe(newer.id);
    expect((await d.r.plans.active())?.id).toBe(newer.id);
  });
});

describe('sync banners', () => {
  it('Today: offline with changes waiting', async () => {
    const d = device();
    setOnline(false);
    await logSet(d);
    await syncOnce(d.db, memServer().transport);
    await renderApp('/', { data: d });
    expect(await screen.findByText('Offline: logging still works')).toBeTruthy();
    expect(screen.getByText(/changes saved on this phone/)).toBeTruthy();
  });

  it('Today: sync failed, with Retry', async () => {
    const d = device();
    const server = memServer();
    server.transport.fail = new SyncHttpError(500);
    await logSet(d);
    await syncOnce(d.db, server.transport);
    await renderApp('/', { data: d });
    expect(await screen.findByText(/haven’t synced/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('Today: sign in again when the session expired', async () => {
    const d = device();
    const server = memServer();
    server.transport.fail = new SyncHttpError(401);
    await syncOnce(d.db, server.transport);
    await renderApp('/', { data: d });
    expect(await screen.findByText('Sign in again to sync')).toBeTruthy();
    expect((await readStatus(d.db)).state).toBe('signin');
  });
});
