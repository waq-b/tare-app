import { describe, expect, it } from 'vitest';
import { Store, uuidv7 } from '../../src/db/index.ts';
import { profile, setup } from './helpers.ts';

describe('uuidv7', () => {
  it('is a v7 UUID that sorts by time', () => {
    const a = uuidv7(1000);
    const b = uuidv7(2000);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a < b).toBe(true);
    expect(uuidv7(1000)).not.toBe(a);
  });
});

describe('Store', () => {
  it('saves a record and queues it in one go', async () => {
    const { db, store } = setup();
    const w = await store.put('weighIns', {
      date: '2026-09-01',
      time: '07:30',
      kg: 92.4,
      waistCm: null,
    });
    expect(await db.weighIns.get(w.id)).toEqual(w);
    const out = await db.outbox.toArray();
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ table: 'weighIns', id: w.id, record: w });
  });

  it('rejects an invalid record and writes nothing', async () => {
    const { db, store } = setup();
    await expect(
      store.put('weighIns', { date: '1 Sept', time: '07:30', kg: -1, waistCm: null }),
    ).rejects.toThrow();
    expect(await db.weighIns.count()).toBe(0);
    expect(await db.outbox.count()).toBe(0);
  });

  it('rolls back the record if queueing fails', async () => {
    const { db, store } = setup();
    db.outbox.hook('creating', () => {
      throw new Error('disk full');
    });
    await expect(
      store.put('weighIns', { date: '2026-09-01', time: '07:30', kg: 92, waistCm: null }),
    ).rejects.toThrow('disk full');
    expect(await db.weighIns.count()).toBe(0);
  });

  it('update stamps a newer updatedAt and queues again', async () => {
    const { db, store } = setup();
    const a = await store.put('profile', { ...profile, id: 'me' });
    const b = await store.update('profile', 'me', { daysPerWeek: 4 });
    expect(b.daysPerWeek).toBe(4);
    expect(b.updatedAt).toBeGreaterThan(a.updatedAt);
    expect(await db.outbox.count()).toBe(2);
  });

  it('updatedAt always goes up for a record, even in the same millisecond', async () => {
    const { db } = setup();
    const frozen = new Store(db, () => 1000);
    const a = await frozen.put('weighIns', {
      date: '2026-09-01',
      time: '07:30',
      kg: 92,
      waistCm: null,
    });
    const b = await frozen.update('weighIns', a.id, { kg: 91 });
    const c = await frozen.update('weighIns', a.id, { kg: 90 });
    expect([a.updatedAt, b.updatedAt, c.updatedAt]).toEqual([1000, 1001, 1002]);
  });

  it('remove is a soft delete: hidden from reads, kept and queued for sync', async () => {
    const { db, store } = setup();
    const w = await store.put('weighIns', {
      date: '2026-09-01',
      time: '07:30',
      kg: 92,
      waistCm: null,
    });
    await store.remove('weighIns', w.id);
    expect(await store.get('weighIns', w.id)).toBeUndefined();
    expect(await store.all('weighIns')).toEqual([]);
    expect((await db.weighIns.get(w.id))?.deleted).toBe(true);
    expect((await db.outbox.toArray()).at(-1)?.record).toMatchObject({ id: w.id, deleted: true });
  });

  it('updating a missing record fails loudly', async () => {
    const { store } = setup();
    await expect(store.update('weighIns', 'nope', { kg: 90 })).rejects.toThrow('no record');
  });
});
