// Live reads for screens: they re-render when the data changes (dexie-react-hooks).
// `undefined` means still loading; `null` means there's nothing.
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { isoDay } from '../lib/dates.ts';
import { bodyStatsOf, estimateFor } from '../lib/estimate.ts';
import { useAppData } from './DbContext.tsx';

export function useProfile() {
  const { r } = useAppData();
  return useLiveQuery(async () => (await r.profile.get()) ?? null, [r]);
}

export function useActivePlan() {
  const { r } = useAppData();
  return useLiveQuery(async () => (await r.plans.active()) ?? null, [r]);
}

export function useUnfinishedWorkout() {
  const { r } = useAppData();
  return useLiveQuery(async () => (await r.workouts.unfinished()) ?? null, [r]);
}

export function useFinishedWorkouts() {
  const { r } = useAppData();
  return useLiveQuery(() => r.workouts.finished(), [r]);
}

/** Working sets for an exercise from finished workouts, newest first. */
export function useExerciseHistory(exerciseId: string) {
  const { r } = useAppData();
  return useLiveQuery(() => r.sets.history(exerciseId), [r, exerciseId]);
}

export interface Target {
  /** kg (per hand for dumbbells), or null for an easy first set. */
  load: number | null;
  /** Where it came from: the last finished workout, the plan, or an estimate from body stats. */
  source: 'history' | 'plan' | 'estimate' | null;
  /** An estimate for a pulldown or cable row: a rough guide, the stack decides. */
  stackDependent: boolean;
}

/** The load to aim for per exercise: the last working load, else the plan's start weight, else
 * a suggestion from body stats (tr.global.starting_load), else an easy first set. */
export function useTargetLoads(
  items: readonly {
    exerciseId: string;
    startLoad: number | null;
    repRange: readonly [number, number];
  }[],
) {
  const { r } = useAppData();
  const key = items.map((i) => `${i.exerciseId}:${i.startLoad}:${i.repRange[0]}`).join('|');
  return useLiveQuery(async () => {
    const profile = await r.profile.get();
    const weight = (await r.weighIns.list()).at(-1)?.kg ?? null;
    const stats = bodyStatsOf(profile, weight, new Date().getFullYear());
    const out: Record<string, Target> = {};
    for (const i of items) {
      const last = await r.sets.lastWorkingLoad(i.exerciseId);
      if (last !== null) {
        out[i.exerciseId] = { load: last, source: 'history', stackDependent: false };
      } else if (i.startLoad !== null) {
        out[i.exerciseId] = { load: i.startLoad, source: 'plan', stackDependent: false };
      } else {
        const e = estimateFor(i.exerciseId, i.repRange[0], stats);
        out[i.exerciseId] =
          e && e.load !== null
            ? { load: e.load, source: 'estimate', stackDependent: e.stackDependent }
            : { load: null, source: null, stackDependent: false };
      }
    }
    return out;
    // `key` stands in for `items`, so a new array with the same contents doesn't re-query.
  }, [r, key]);
}

/** The clock, read once per mount (today's date for the screen). */
export function useToday(): string {
  const [today] = useState(() => isoDay(new Date()));
  return today;
}
