// Numbers derived from the logs with the real rules (for charts, tiles and tables).
import { exercise, muscleGroupOf } from '@tare/data';
import { sessions } from './logs';
import { e1rm, fatLoss, setCounting } from './rules';

/** Weekly working sets per muscle, counted per tr.global.set_counting (primary 1, secondary
 * 0.5; stabilisers don't count). Warm-ups never count (tr.global.warm_up). */
export function weeklySets(week: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sessions.filter((x) => x.week === week)) {
    for (const ex of s.exercises) {
      const n = ex.sets.filter((x) => x.kind === 'work').length;
      const e = exercise(ex.exerciseId);
      for (const m of e.primary_muscles) out[m] = (out[m] ?? 0) + n * setCounting.primary;
      for (const m of e.secondary_muscles) out[m] = (out[m] ?? 0) + n * setCounting.secondary;
    }
  }
  return out;
}

/** Group roll-up for display (tr.global.muscle_group_rollup): per set, a group gets the MAX of
 * its members' credit, not the sum. Never compared to a target. */
export function weeklyGroupSets(week: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sessions.filter((x) => x.week === week)) {
    for (const ex of s.exercises) {
      const n = ex.sets.filter((x) => x.kind === 'work').length;
      const e = exercise(ex.exerciseId);
      const credit: Record<string, number> = {};
      for (const m of e.primary_muscles) credit[muscleGroupOf(m)] = setCounting.primary;
      for (const m of e.secondary_muscles) {
        const g = muscleGroupOf(m);
        credit[g] = Math.max(credit[g] ?? 0, setCounting.secondary);
      }
      for (const [g, c] of Object.entries(credit)) out[g] = (out[g] ?? 0) + n * c;
    }
  }
  return out;
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
