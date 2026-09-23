// Manual backup from Settings: every record (deleted ones too, so a restore can't bring a
// deleted record back) as one JSON file. Import merges by last-write-wins and queues what it
// changed for sync.
import { z } from 'zod';
import type { TareDb } from './db.ts';
import { SYNCED, SYNCED_TABLES, type RecordOf, type SyncedTable } from './model.ts';

export const BACKUP_FORMAT = 'tare-backup';
export const BACKUP_VERSION = 1;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  tables: { [T in SyncedTable]: RecordOf[T][] };
}

export async function exportAll(db: TareDb, now = Date.now()): Promise<Backup> {
  const tables = {} as Backup['tables'];
  for (const t of SYNCED_TABLES) {
    (tables as Record<string, unknown[]>)[t] = await db.table(t).toArray();
  }
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now, tables };
}

const BackupFile = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().min(1).max(BACKUP_VERSION),
  exportedAt: z.number(),
  tables: z.object(
    Object.fromEntries(SYNCED_TABLES.map((t) => [t, z.array(SYNCED[t]).default([])])) as {
      [T in SyncedTable]: z.ZodDefault<z.ZodArray<(typeof SYNCED)[T]>>;
    },
  ),
});

export interface ImportResult {
  added: number;
  updated: number;
  unchanged: number;
}

/** Validates the whole file first; nothing is written if any record is invalid. */
export async function importAll(
  db: TareDb,
  json: unknown,
  now = Date.now(),
): Promise<ImportResult> {
  const parsed = BackupFile.safeParse(json);
  if (!parsed.success) {
    const where = parsed.error.issues[0]?.path.join('.') ?? '';
    throw new Error(`Not a Tare backup, or it's damaged (${where || 'format'})`);
  }
  const result: ImportResult = { added: 0, updated: 0, unchanged: 0 };
  await db.transaction('rw', [...SYNCED_TABLES.map((t) => db.table(t)), db.outbox], async () => {
    for (const t of SYNCED_TABLES) {
      const table = db.table<RecordOf[SyncedTable], string>(t);
      for (const rec of parsed.data.tables[t] as RecordOf[SyncedTable][]) {
        const cur = await table.get(rec.id);
        if (cur && cur.updatedAt >= rec.updatedAt) {
          result.unchanged++;
          continue;
        }
        await table.put(rec);
        await db.outbox.add({ table: t, id: rec.id, record: rec, queuedAt: now });
        result[cur ? 'updated' : 'added']++;
      }
    }
  });
  return result;
}
