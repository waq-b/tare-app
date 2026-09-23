// Writes from the Ledger. Plain functions (not in the screen) so the clock is read here.
import type { AppData } from '../data/DbContext.tsx';
import type { SetRecord, WorkoutExercise, WorkoutRecord } from '../db/index.ts';
import { clearRest, startRest } from './rest.ts';

/** Logs a working set and starts the rest timer for it. */
export async function logWorkSet(
  data: AppData,
  workout: WorkoutRecord,
  ex: WorkoutExercise,
  load: number,
  reps: number,
  now = Date.now(),
): Promise<SetRecord> {
  const set = await data.r.sets.log({
    workoutId: workout.id,
    exerciseId: ex.exerciseId,
    kind: 'work',
    load,
    reps,
    effort: null,
  });
  await startRest(data.db, {
    workoutId: workout.id,
    until: now + ex.restSec * 1000,
    total: ex.restSec,
    setId: set.id,
  });
  return set;
}

/** Undoes a logged set; its rest stops too. */
export async function undoSet(data: AppData, set: SetRecord, restSetId: string | undefined) {
  await data.r.sets.remove(set.id);
  if (restSetId === set.id) await clearRest(data.db);
}
