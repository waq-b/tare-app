import type { AppData } from '../data/DbContext.tsx';
import type { WorkoutRecord } from '../db/index.ts';
import { clearRest } from './rest.ts';

/** Closes the workout with its feel (optional) and stops any rest timer. */
export async function finishWorkout(
  data: AppData,
  workout: WorkoutRecord,
  feel: WorkoutRecord['feel'],
) {
  await clearRest(data.db);
  await data.r.workouts.finish(workout.id, feel);
}
