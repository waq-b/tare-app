// One sync pass: push the outbox, then pull what changed since the cursor. Local-first: the
// phone never waits for this, and nothing is lost if it fails (the outbox keeps it).
import type { TareDb } from '../db/index.ts';
import { SYNCED, SYNCED_TABLES, type OutboxEntry, type SyncedTable } from '../db/index.ts';
import { SyncHttpError, type SyncTransport } from './transport.ts';

export type SyncState = 'idle' | 'syncing' | 'offline' | 'failed' | 'signin' | 'not_allowed';

export interface SyncStatus {
  state: SyncState;
  /** When the last pass finished cleanly (ms). */
  lastSyncedAt: number | null;
  /** Changes waiting to be sent. */
  pending: number;
  /** Pulled records that didn't match the app's schema (kept on the server, not applied). */
  rejected: number;
}

export const STATUS_KEY = 'syncStatus';
const CURSOR_KEY = 'syncCursor';
const BATCH = 500;

export async function readStatus(db: TareDb): Promise<SyncStatus> {
  const s = (await db.meta.get(STATUS_KEY))?.value as SyncStatus | undefined;
  return s ?? { state: 'idle', lastSyncedAt: null, pending: await db.outbox.count(), rejected: 0 };
}

async function setStatus(db: TareDb, change: Partial<SyncStatus>) {
  const cur = await readStatus(db);
  await db.meta.put({
    key: STATUS_KEY,
    value: { ...cur, ...change, pending: await db.outbox.count() },
  });
}

/** The latest queued copy of each record, oldest first, with the outbox rows it covers. */
export function squash(entries: readonly OutboxEntry[]) {
  const latest = new Map<string, OutboxEntry>();
  for (const e of entries) {
    const k = `${e.table}/${e.id}`;
    const cur = latest.get(k);
    if (!cur || e.record.updatedAt >= cur.record.updatedAt) latest.set(k, e);
  }
  return [...latest.values()];
}

async function push(db: TareDb, t: SyncTransport) {
  for (;;) {
    const entries = await db.outbox
      .orderBy('seq')
      .limit(BATCH * 4)
      .toArray();
    if (!entries.length) return;
    const batch = squash(entries).slice(0, BATCH);
    const keys = new Set(batch.map((e) => `${e.table}/${e.id}`));
    await t.push(batch.map((e) => ({ table: e.table, id: e.id, record: e.record })));
    // Only what was sent, and only copies no newer than what was sent: anything queued during
    // the push stays for the next one.
    const sent = new Map(batch.map((e) => [`${e.table}/${e.id}`, e.record.updatedAt]));
    const done = entries
      .filter((e) => keys.has(`${e.table}/${e.id}`))
      .filter((e) => e.record.updatedAt <= (sent.get(`${e.table}/${e.id}`) ?? -1))
      .map((e) => e.seq as number);
    await db.outbox.bulkDelete(done);
  }
}

async function pull(db: TareDb, t: SyncTransport): Promise<number> {
  let rejected = 0;
  let cursor = Number((await db.meta.get(CURSOR_KEY))?.value ?? 0);
  for (;;) {
    const page = await t.pull(cursor);
    await db.transaction('rw', [...SYNCED_TABLES.map((x) => db.table(x)), db.meta], async () => {
      for (const c of page.changes) {
        if (!(SYNCED_TABLES as string[]).includes(c.table)) continue;
        const table = c.table as SyncedTable;
        const parsed = SYNCED[table].safeParse(c.record);
        if (!parsed.success) {
          rejected++;
          continue;
        }
        const local = await db.table(table).get(c.id);
        // Last write wins; a pulled record is never queued again.
        if (!local || (local as { updatedAt: number }).updatedAt < parsed.data.updatedAt) {
          await db.table(table).put(parsed.data);
        }
      }
      cursor = page.cursor;
      await db.meta.put({ key: CURSOR_KEY, value: cursor });
    });
    if (!page.more) return rejected;
  }
}

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/** One pass. Never throws: the outcome is in the returned (and saved) status. */
export async function syncOnce(db: TareDb, t: SyncTransport, now = Date.now): Promise<SyncStatus> {
  if (isOffline()) {
    await setStatus(db, { state: 'offline' });
    return readStatus(db);
  }
  await setStatus(db, { state: 'syncing' });
  try {
    await push(db, t);
    const rejected = await pull(db, t);
    await setStatus(db, { state: 'idle', lastSyncedAt: now(), rejected });
  } catch (e) {
    const state: SyncState =
      e instanceof SyncHttpError && e.status === 401
        ? 'signin'
        : e instanceof SyncHttpError && e.status === 403
          ? 'not_allowed'
          : isOffline() || e instanceof TypeError
            ? 'offline'
            : 'failed';
    await setStatus(db, { state });
  }
  return readStatus(db);
}
