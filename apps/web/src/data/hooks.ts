// Live reads for screens: they re-render when the data changes (dexie-react-hooks).
// `undefined` means still loading; `null` means there's nothing.
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { isoDay } from '../lib/dates.ts';
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

/** The load to prefill per exercise (#70): the last working load, else the plan's start. */
export function useTargetLoads(items: readonly { exerciseId: string; startLoad: number | null }[]) {
  const { r } = useAppData();
  const key = items.map((i) => `${i.exerciseId}:${i.startLoad}`).join('|');
  return useLiveQuery(async () => {
    const out: Record<string, number | null> = {};
    for (const i of items) {
      out[i.exerciseId] = (await r.sets.lastWorkingLoad(i.exerciseId)) ?? i.startLoad;
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
