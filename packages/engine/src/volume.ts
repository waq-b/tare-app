// Weekly volume per muscle (tr.global.set_counting) with the display-only group roll-up
// (tr.global.muscle_group_rollup). Callers pass working sets only: warm-ups never count.
import { exercise, muscleGroupOf, rule } from '@tare/data';

export interface WorkSets {
  exerciseId: string;
  /** Working sets done (not warm-ups). */
  sets: number;
}

export interface WeeklySets {
  /** Fractional sets per muscle: compare these to targets. */
  perMuscle: Record<string, number>;
  /** Per muscle group, for display only. Never compared to a target. */
  perGroup: Record<string, number>;
  ruleIds: string[];
}

export function weeklySets(entries: readonly WorkSets[]): WeeklySets {
  const credit = rule('tr.global.set_counting').raw['value'] as {
    primary: number;
    secondary: number;
  };
  const perMuscle: Record<string, number> = {};
  const perGroup: Record<string, number> = {};
  for (const { exerciseId, sets } of entries) {
    if (sets <= 0) continue;
    const e = exercise(exerciseId);
    const groups: Record<string, number> = {};
    const add = (m: string, c: number) => {
      perMuscle[m] = (perMuscle[m] ?? 0) + sets * c;
      const g = muscleGroupOf(m);
      groups[g] = Math.max(groups[g] ?? 0, c);
    };
    for (const m of e.primary_muscles) add(m, credit.primary);
    for (const m of e.secondary_muscles) add(m, credit.secondary);
    for (const [g, c] of Object.entries(groups)) perGroup[g] = (perGroup[g] ?? 0) + sets * c;
  }
  return {
    perMuscle,
    perGroup,
    ruleIds: ['tr.global.set_counting', 'tr.global.muscle_group_rollup'],
  };
}
