// Numbers derived from the logs with the real rules (for charts, tiles and tables).
import { weeklySets as engineWeeklySets } from '@tare/engine';
import { sessions } from './logs';
import { e1rm, fatLoss } from './rules';

/** Working sets per exercise in a week. Warm-ups never count (tr.global.warm_up). */
const workSets = (week: number) =>
  sessions
    .filter((x) => x.week === week)
    .flatMap((s) =>
      s.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets.filter((x) => x.kind === 'work').length,
      })),
    );

/** Weekly fractional sets per muscle (the engine's tr.global.set_counting). */
export function weeklySets(week: number): Record<string, number> {
  return engineWeeklySets(workSets(week)).perMuscle;
}

/** Group roll-up for display only (tr.global.muscle_group_rollup). Never compared to a target. */
export function weeklyGroupSets(week: number): Record<string, number> {
  return engineWeeklySets(workSets(week)).perGroup;
}

/** The user's weekly set target band (tr.goal.fat_loss, beginner). Same for every muscle. */
export const weeklySetTarget = fatLoss.weekly_sets_per_muscle.beginner;

/** Best estimated 1RM per logged session for an exercise (working sets within the rule). */
export function e1rmHistory(exerciseId: string) {
  return sessions.flatMap((s) => {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) return [];
    const best = Math.max(
      ...ex.sets.filter((x) => x.kind === 'work').map((x) => e1rm(x.load, x.reps) ?? 0),
    );
    return best > 0 ? [{ date: s.date, week: s.week, e1rm: best }] : [];
  });
}
