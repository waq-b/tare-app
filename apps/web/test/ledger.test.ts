import { describe, expect, it } from 'vitest';
import type { SetRecord, WorkoutExercise, WorkoutRecord } from '../src/db/index.ts';
import { exerciseView, lastSession, summarise, targetReps } from '../src/workout/ledger.ts';

const squat = 'Barbell_Squat';
const bench = 'Barbell_Bench_Press_-_Medium_Grip';
const ex = (over: Partial<WorkoutExercise> = {}): WorkoutExercise => ({
  exerciseId: squat,
  swappedFrom: null,
  skipped: false,
  sets: 3,
  repRange: [6, 10],
  restSec: 120,
  load: 80,
  ...over,
});
const workout = (
  exercises: WorkoutExercise[],
  over: Partial<WorkoutRecord> = {},
): WorkoutRecord => ({
  id: 'w1',
  updatedAt: 0,
  planId: null,
  sessionKey: 'A',
  date: '2026-09-22',
  startedAt: 0,
  finishedAt: null,
  feel: null,
  current: 0,
  exercises,
  ...over,
});
let t = 0;
const set = (over: Partial<SetRecord>): SetRecord => ({
  id: `s${++t}`,
  updatedAt: t,
  workoutId: 'w1',
  exerciseId: squat,
  kind: 'work',
  load: 80,
  reps: 8,
  effort: null,
  loggedAt: t,
  ...over,
});

describe('exerciseView', () => {
  it('first set is current, at the target load, with the engine’s warm-ups', () => {
    const v = exerciseView(workout([ex()]), 0, [], [])!;
    expect(v.work.map((w) => w.state)).toEqual(['current', 'upcoming', 'upcoming']);
    expect(v.current).toMatchObject({ index: 1, load: 80, reps: 6 });
    // 50/75/90% (target 6 reps, so the 90% single is in), rounded down to 2.5 kg
    expect(v.warmups.map((w) => w.load)).toEqual([40, 60, 70]);
  });

  it('logged sets are done; the next aims for the last logged weight', () => {
    const v = exerciseView(workout([ex()]), 0, [set({ load: 82.5, reps: 8 })], [])!;
    expect(v.work.map((w) => w.state)).toEqual(['done', 'current', 'upcoming']);
    expect(v.current?.load).toBe(82.5);
  });

  it('complete once every planned set is logged; extra logged sets still show', () => {
    const logged = [set({}), set({}), set({}), set({})];
    const v = exerciseView(workout([ex()]), 0, logged, [])!;
    expect(v.complete).toBe(true);
    expect(v.work).toHaveLength(4);
  });

  it('target reps follow last time, kept inside the rep range', () => {
    const last = [set({ reps: 9, workoutId: 'w0' }), set({ reps: 12, workoutId: 'w0' })];
    expect(targetReps(ex(), 1, last)).toBe(9);
    expect(targetReps(ex(), 2, last)).toBe(10);
    expect(targetReps(ex(), 3, last)).toBe(10);
    expect(targetReps(ex(), 1, [])).toBe(6);
  });

  it('no known weight: no warm-ups, and the current set has no load (calibration)', () => {
    const v = exerciseView(workout([ex({ load: null })]), 0, [], [])!;
    expect(v.warmups).toEqual([]);
    expect(v.current?.load).toBeNull();
  });

  it('warm-ups only for the first exercise of a pattern', () => {
    const w = workout([ex(), ex({ exerciseId: 'Leg_Press', load: 100 })]);
    expect(exerciseView(w, 1, [], [])?.warmups).toEqual([]);
  });
});

describe('lastSession', () => {
  it('is the newest workout’s sets, in logged order', () => {
    const h = [
      set({ workoutId: 'b', loggedAt: 20, reps: 7 }),
      set({ workoutId: 'b', loggedAt: 10, reps: 8 }),
      set({ workoutId: 'a', loggedAt: 5 }),
    ];
    expect(lastSession(h).map((x) => x.reps)).toEqual([8, 7]);
  });
});

describe('summarise', () => {
  it('counts working sets and volume (both hands for dumbbells), and minutes', () => {
    const sets = [
      set({ load: 80, reps: 8 }),
      set({ kind: 'warmup', load: 40, reps: 5 }),
      set({ exerciseId: 'Incline_Dumbbell_Press', load: 20, reps: 10 }),
    ];
    const sum = summarise(workout([ex()]), sets, {}, 45 * 60000);
    expect(sum).toMatchObject({ sets: 2, volume: 80 * 8 + 20 * 10 * 2, minutes: 45 });
  });

  it('a new best e1RM is a PR; the first time ever is not', () => {
    const before = [set({ workoutId: 'w0', load: 80, reps: 8 })];
    const sum = summarise(workout([ex()]), [set({ load: 85, reps: 8 })], { [squat]: before }, 1);
    expect(sum.prs).toEqual([{ exerciseId: squat, today: 107.7, before: 101.3 }]);
    expect(summarise(workout([ex()]), [set({})], {}, 1).prs).toEqual([]);
  });

  it('beat last time: more weight, or more reps at the same weight', () => {
    const before = {
      [squat]: [set({ workoutId: 'w0', load: 80, reps: 8 })],
      [bench]: [set({ workoutId: 'w0', exerciseId: bench, load: 60, reps: 8 })],
    };
    const sets = [set({ load: 82.5, reps: 6 }), set({ exerciseId: bench, load: 60, reps: 9 })];
    expect(summarise(workout([ex()]), sets, before, 1).better).toEqual([
      { exerciseId: squat, before: '80 × 8', after: '82.5 × 6', delta: '+2.5 kg' },
      { exerciseId: bench, before: '60 × 8', after: '60 × 9', delta: '+1 rep' },
    ]);
  });
});
