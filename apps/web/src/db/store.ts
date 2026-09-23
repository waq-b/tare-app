// Every write goes through here: the record and its outbox entry land in one transaction, so
// a change is never saved without being queued for sync, or queued without being saved.
import type { TareDb } from './db.ts';
import { uuidv7 } from './ids.ts';
import { SYNCED, type RecordOf, type SyncedTable } from './model.ts';

export type Clock = () => number;

type New<T extends SyncedTable> = Omit<RecordOf[T], 'id' | 'updatedAt'> & { id?: string };

export class Store {
  constructor(
    readonly db: TareDb,
    readonly now: Clock = Date.now,
  ) {}

  private table<T extends SyncedTable>(t: T) {
    return this.db.table<RecordOf[T], string>(t);
  }

  /** Create or replace a record (validated), stamped and queued. */
  async put<T extends SyncedTable>(t: T, rec: New<T>): Promise<RecordOf[T]> {
    const at = this.now();
    return this.db.transaction('rw', this.table(t), this.db.outbox, async () => {
      const id = rec.id ?? uuidv7(at);
      // Each change to a record gets a later updatedAt than the last, even within the same
      // millisecond, so last-write-wins never drops a newer edit.
      const prev = rec.id ? await this.table(t).get(id) : undefined;
      const updatedAt = prev ? Math.max(at, prev.updatedAt + 1) : at;
      const full = SYNCED[t].parse({ ...rec, id, updatedAt }) as RecordOf[T];
      await this.table(t).put(full);
      await this.db.outbox.add({ table: t, id: full.id, record: full, queuedAt: at });
      return full;
    });
  }

  /** Change fields on an existing record. */
  async update<T extends SyncedTable>(
    t: T,
    id: string,
    change: Partial<Omit<RecordOf[T], 'id' | 'updatedAt'>>,
  ): Promise<RecordOf[T]> {
    return this.db.transaction('rw', this.table(t), this.db.outbox, async () => {
      const cur = await this.table(t).get(id);
      if (!cur) throw new Error(`${t}: no record ${id}`);
      return this.put(t, { ...cur, ...change } as New<T>);
    });
  }

  /** Soft delete: kept (so the delete syncs), hidden from reads. */
  async remove(t: SyncedTable, id: string): Promise<void> {
    await this.update(t, id, { deleted: true } as never);
  }

  async get<T extends SyncedTable>(t: T, id: string): Promise<RecordOf[T] | undefined> {
    const r = await this.table(t).get(id);
    return r && !r.deleted ? r : undefined;
  }

  async all<T extends SyncedTable>(t: T): Promise<RecordOf[T][]> {
    return (await this.table(t).toArray()).filter((r) => !r.deleted);
  }
}
