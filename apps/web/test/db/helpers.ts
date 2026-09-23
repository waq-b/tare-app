import { repos, Store, TareDb, type Profile, type WorkoutRecord } from '../../src/db/index.ts';

let n = 0;

/** A fresh database per test, with a clock that ticks 1s per call from 1 Sept 2026. */
export function setup() {
  const db = new TareDb(`test-${++n}-${Math.random()}`);
  let t = Date.UTC(2026, 8, 1, 9);
  const now = () => (t += 1000);
  const store = new Store(db, now);
  return { db, store, r: repos(store), now };
}

export const profile: Omit<Profile, 'id' | 'updatedAt'> = {
  goalId: 'tr.goal.fat_loss',
  goalsRanked: ['fat_loss', 'look_better', 'strength'],
  level: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 60,
  units: 'kg',
  dumbbellConvention: 'per_hand',
  kit: ['barbell', 'dumbbells'],
  cantDo: ['pull_up'],
  region: 'england',
  maxRpe: null,
  onboardedAt: null,
};

export const workout: Pick<WorkoutRecord, 'planId' | 'sessionKey' | 'date' | 'exercises'> = {
  planId: null,
  sessionKey: 'A',
  date: '2026-09-01',
  exercises: [
    {
      exerciseId: 'Barbell_Squat',
      swappedFrom: null,
      skipped: false,
      sets: 3,
      repRange: [6, 10],
      restSec: 120,
      load: 80,
    },
    {
      exerciseId: 'Barbell_Bench_Press_-_Medium_Grip',
      swappedFrom: null,
      skipped: false,
      sets: 3,
      repRange: [6, 10],
      restSec: 120,
      load: 60,
    },
  ],
};
