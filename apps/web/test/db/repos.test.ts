import { describe, expect, it } from 'vitest';
import { PROFILE_ID } from '../../src/db/index.ts';
import { profile, setup, workout } from './helpers.ts';

const squat = 'Barbell_Squat';
const plan = {
  name: 'Full body A/B/C',
  startedOn: '2026-09-01',
  sessions: [
    {
      key: 'A',
      name: 'Session A',
      weekday: 0,
      exercises: [
        {
          exerciseId: squat,
          sets: 3,
          repRange: [6, 10] as [number, number],
          restSec: 150,
          startLoad: null,
        },
      ],
    },
  ],
};

describe('repositories', () => {
  it('profile: one record, saved under a fixed ID', async () => {
    const { r } = setup();
    expect(await r.profile.get()).toBeUndefined();
    await r.profile.save(profile);
    await r.profile.save({ ...profile, daysPerWeek: 4 });
    expect((await r.profile.get())?.id).toBe(PROFILE_ID);
    expect((await r.profile.get())?.daysPerWeek).toBe(4);
  });

  it('screening: latest wins', async () => {
    const { r } = setup();
    const base = {
      answers: { currently_active: 'yes' as const },
      mskAreas: [],
      mskSide: null,
      clearedByGp: null,
      clearedOn: null,
      gpNote: null,
      ruleIds: ['sf.screening'],
    };
    await r.screening.save({ ...base, takenAt: 1, result: 'medical_clearance_first' });
    await r.screening.save({ ...base, takenAt: 2, result: 'start_light_to_moderate' });
    expect((await r.screening.latest())?.result).toBe('start_light_to_moderate');
  });

  it('plans: activating one switches the other off', async () => {
    const { r, db } = setup();
    const a = await r.plans.activate(plan);
    const b = await r.plans.activate({ ...plan, name: 'Block 2' });
    expect((await r.plans.active())?.id).toBe(b.id);
    expect((await db.plans.get(a.id))?.active).toBe(false);
  });

  it('workouts: start, find the unfinished one, finish', async () => {
    const { r } = setup();
    const w = await r.workouts.start(workout);
    expect((await r.workouts.unfinished())?.id).toBe(w.id);
    await r.workouts.finish(w.id, 'good');
    expect(await r.workouts.unfinished()).toBeUndefined();
    const [done] = await r.workouts.finished();
    expect(done?.feel).toBe('good');
    expect(done?.finishedAt).toBeGreaterThan(done?.startedAt ?? Infinity);
  });

  it('sets: log, edit, remove, in logged order', async () => {
    const { r } = setup();
    const w = await r.workouts.start(workout);
    const warm = await r.sets.log({
      workoutId: w.id,
      exerciseId: squat,
      kind: 'warmup',
      load: 40,
      reps: 5,
      effort: null,
    });
    const one = await r.sets.log({
      workoutId: w.id,
      exerciseId: squat,
      kind: 'work',
      load: 80,
      reps: 8,
      effort: 'ok',
    });
    const two = await r.sets.log({
      workoutId: w.id,
      exerciseId: squat,
      kind: 'work',
      load: 80,
      reps: 8,
      effort: null,
    });
    await r.sets.edit(two.id, { reps: 7, effort: 'hard' });
    await r.sets.remove(warm.id);
    const sets = await r.sets.forWorkout(w.id);
    expect(sets.map((s) => s.id)).toEqual([one.id, two.id]);
    expect(sets[1]).toMatchObject({ reps: 7, effort: 'hard' });
  });

  it('lastWorkingLoad: newest working set from a finished workout (#70)', async () => {
    const { r } = setup();
    expect(await r.sets.lastWorkingLoad(squat)).toBeNull();
    const w1 = await r.workouts.start(workout);
    await r.sets.log({
      workoutId: w1.id,
      exerciseId: squat,
      kind: 'work',
      load: 80,
      reps: 8,
      effort: null,
    });
    await r.sets.log({
      workoutId: w1.id,
      exerciseId: squat,
      kind: 'warmup',
      load: 60,
      reps: 3,
      effort: null,
    });
    await r.workouts.finish(w1.id, 'good');
    const w2 = await r.workouts.start({ ...workout, date: '2026-09-03' });
    await r.sets.log({
      workoutId: w2.id,
      exerciseId: squat,
      kind: 'work',
      load: 82.5,
      reps: 8,
      effort: null,
    });
    // w2 isn't finished yet: it doesn't count
    expect(await r.sets.lastWorkingLoad(squat)).toBe(80);
    await r.workouts.finish(w2.id, 'tough');
    expect(await r.sets.lastWorkingLoad(squat)).toBe(82.5);
  });

  it('lastWorkingLoad goes by the workout’s date, not when it was typed in', async () => {
    const { r } = setup();
    const recent = await r.workouts.start({ ...workout, date: '2026-09-10' });
    await r.sets.log({
      workoutId: recent.id,
      exerciseId: squat,
      kind: 'work',
      load: 90,
      reps: 5,
      effort: null,
    });
    await r.workouts.finish(recent.id, 'good');
    // An older session, logged afterwards (e.g. backfilled)
    const older = await r.workouts.start({ ...workout, date: '2026-09-01' });
    await r.sets.log({
      workoutId: older.id,
      exerciseId: squat,
      kind: 'work',
      load: 70,
      reps: 5,
      effort: null,
    });
    await r.workouts.finish(older.id, 'good');
    expect(await r.sets.lastWorkingLoad(squat)).toBe(90);
  });

  it('removing a workout soft-deletes its sets too', async () => {
    const { r, db } = setup();
    const w = await r.workouts.start(workout);
    await r.sets.log({
      workoutId: w.id,
      exerciseId: squat,
      kind: 'work',
      load: 80,
      reps: 8,
      effort: null,
    });
    await r.workouts.remove(w.id);
    expect(await r.sets.forWorkout(w.id)).toEqual([]);
    expect(await r.workouts.get(w.id)).toBeUndefined();
    expect((await db.sets.toArray()).every((s) => s.deleted)).toBe(true);
  });

  it('weigh-ins: oldest first, removable', async () => {
    const { r } = setup();
    await r.weighIns.add({ date: '2026-09-08', time: '07:00', kg: 91.8, waistCm: null });
    const a = await r.weighIns.add({ date: '2026-09-01', time: '07:00', kg: 92.4, waistCm: 98 });
    expect((await r.weighIns.list()).map((w) => w.date)).toEqual(['2026-09-01', '2026-09-08']);
    await r.weighIns.remove(a.id);
    expect(await r.weighIns.list()).toHaveLength(1);
  });

  it('pain flags: raise, list active, clear', async () => {
    const { r } = setup();
    const f = await r.painFlags.raise({
      date: '2026-09-01',
      area: 'knee',
      side: 'left',
      ruleId: 'pain_during_exercise',
      workoutId: null,
      exerciseId: squat,
      skippedExerciseIds: [],
    });
    expect((await r.painFlags.active()).map((x) => x.id)).toEqual([f.id]);
    await r.painFlags.clear(f.id, '2026-09-05');
    expect(await r.painFlags.active()).toEqual([]);
    expect((await r.painFlags.all())[0]).toMatchObject({
      status: 'cleared',
      clearedOn: '2026-09-05',
    });
  });
});
