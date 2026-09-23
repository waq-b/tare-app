import { describe, expect, it } from 'vitest';
import { exportAll, importAll, SYNCED_TABLES, requestPersistence } from '../../src/db/index.ts';
import { profile, setup, workout } from './helpers.ts';

async function seed() {
  const s = setup();
  await s.r.profile.save(profile);
  const w = await s.r.workouts.start(workout);
  await s.r.sets.log({
    workoutId: w.id,
    exerciseId: 'Barbell_Squat',
    kind: 'work',
    load: 80,
    reps: 8,
    effort: 'ok',
  });
  await s.r.workouts.finish(w.id, 'good');
  const gone = await s.r.weighIns.add({
    date: '2026-09-01',
    time: '07:00',
    kg: 92.4,
    waistCm: null,
  });
  await s.r.weighIns.remove(gone.id);
  await s.r.weighIns.add({ date: '2026-09-02', time: '07:00', kg: 92.1, waistCm: 98 });
  return s;
}

describe('export / import', () => {
  it('round-trips every record, deleted ones included', async () => {
    const a = await seed();
    const file = JSON.parse(JSON.stringify(await exportAll(a.db)));
    const b = setup();
    const res = await importAll(b.db, file);
    for (const t of SYNCED_TABLES) {
      expect(await b.db.table(t).toArray(), t).toEqual(await a.db.table(t).toArray());
    }
    expect(res.added).toBe(Object.values(file.tables as Record<string, unknown[]>).flat().length);
    expect(await b.r.weighIns.list()).toHaveLength(1);
    expect(await b.db.outbox.count()).toBe(res.added);
  });

  it('importing the same file twice changes nothing', async () => {
    const a = await seed();
    const file = await exportAll(a.db);
    const res = await importAll(a.db, file);
    expect(res).toMatchObject({ added: 0, updated: 0 });
  });

  it('keeps the newer copy of a record (last write wins)', async () => {
    const a = await seed();
    const old = await exportAll(a.db);
    await a.r.profile.save({ ...profile, daysPerWeek: 4 });
    await importAll(a.db, old);
    expect((await a.r.profile.get())?.daysPerWeek).toBe(4);

    const b = setup();
    await importAll(b.db, old);
    await importAll(b.db, await exportAll(a.db));
    expect((await b.r.profile.get())?.daysPerWeek).toBe(4);
  });

  it('refuses a damaged file and writes nothing', async () => {
    const a = await seed();
    const file = JSON.parse(JSON.stringify(await exportAll(a.db)));
    file.tables.sets[0].reps = 'eight';
    const b = setup();
    await expect(importAll(b.db, file)).rejects.toThrow('damaged');
    await expect(importAll(b.db, { hello: 1 })).rejects.toThrow('Not a Tare backup');
    for (const t of SYNCED_TABLES) expect(await b.db.table(t).count()).toBe(0);
  });
});

describe('requestPersistence', () => {
  it('asks once, and records the answer', async () => {
    const { db } = setup();
    let asked = 0;
    const storage = {
      persisted: async () => false,
      persist: async () => (asked++, true),
    };
    expect(await requestPersistence(db, storage)).toBe(true);
    expect(asked).toBe(1);
    expect((await db.meta.get('storagePersisted'))?.value).toBe(true);
  });

  it('is fine where the browser has no storage manager', async () => {
    const { db } = setup();
    expect(await requestPersistence(db, undefined)).toBe(false);
  });
});
