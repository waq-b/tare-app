// Ask the browser not to evict our data under storage pressure. Safari and Chrome grant it
// to installed apps; the answer is kept in meta so Settings can show it.
import type { TareDb } from './db.ts';

type StorageLike = Pick<StorageManager, 'persist' | 'persisted'>;

export async function requestPersistence(
  db: TareDb,
  storage: StorageLike | undefined = globalThis.navigator?.storage,
): Promise<boolean> {
  if (!storage?.persist) return false;
  const granted = (await storage.persisted()) || (await storage.persist());
  await db.meta.put({ key: 'storagePersisted', value: granted });
  return granted;
}
