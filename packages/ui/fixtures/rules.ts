// Rule values the fixtures use, read from vpt through @tare/data. Nothing here is hard-coded:
// if the data changes, the fixtures follow (and their tests say so).
import { exercise, goal, rule, vpt } from '@tare/data';

type Obj = Record<string, unknown>;
const value = (id: string) => rule(id).raw['value'] as Obj;

export const setCounting = value('tr.global.set_counting') as {
  primary: number;
  secondary: number;
};

export const warmUp = value('tr.global.warm_up') as {
  ramp: { pct_working_load: number; reps: number; only_if?: string }[];
};

export const e1rmRule = value('tr.global.e1rm') as { max_reps: number; label: string };

// The loader validates required fields only; these extra fields are checked by fixture tests.
export const doubleProgression = vpt().progression.methods.find(
  (m) => m.id === 'pr.double_progression',
) as unknown as Obj & {
  increment_pct: { upper: number; lower: number };
  increment_kg_min: { upper: number; lower: number };
};

export const deload = vpt().progression.deload;

export const fatLoss = goal('tr.goal.fat_loss') as unknown as Obj & {
  rep_range: [number, number];
  rest_seconds: [number, number];
  sets_per_exercise: [number, number];
  weekly_sets_per_muscle: Record<
    'beginner' | 'intermediate',
    { min: number; optimal: number; max: number }
  >;
};

/** Estimated 1RM per tr.global.e1rm (Epley), or null when the set is outside the rule. */
export function e1rm(load: number, reps: number): number | null {
  if (reps < 1 || reps > e1rmRule.max_reps) return null;
  if (reps === 1) return load;
  return Math.round(load * (1 + reps / 30) * 10) / 10;
}

/** Smallest load step for an exercise's kit (kg; per hand for dumbbells). Fixture convention. */
export function loadStep(exerciseId: string): number {
  const ex = exercise(exerciseId);
  if (ex.load_convention === 'per_hand') return 2;
  if (ex.equipment_detail.includes('barbell')) return 2.5;
  return 2.5;
}

/** Next load under pr.double_progression: +increment_pct, at least increment_kg_min, rounded
 * up to the next available step. */
export function progressedLoad(exerciseId: string, load: number): number {
  const cls = exercise(exerciseId).increment_class as 'upper' | 'lower';
  const pct = doubleProgression.increment_pct[cls];
  const min = doubleProgression.increment_kg_min[cls];
  const step = loadStep(exerciseId);
  const raw = load + Math.max((load * pct) / 100, min);
  return Math.ceil(raw / step) * step;
}

/** Whether tr.global.warm_up applies: a compound lift with external load, and the first
 * exercise of its movement pattern in the session. */
export function needsWarmUp(exerciseId: string, patternsSoFar: ReadonlySet<string>): boolean {
  const ex = exercise(exerciseId);
  return (
    ex['mechanic'] === 'compound' &&
    ex.load_convention !== 'bodyweight' &&
    !patternsSoFar.has(ex.movement_pattern)
  );
}

/** Warm-up ramp for a working load and rep target: rounded down to the kit step, skipping a
 * step that rounds to the same load as the previous one (tr.global.warm_up `rounding`). */
export function warmUpSets(exerciseId: string, load: number, workingReps: number) {
  const step = loadStep(exerciseId);
  const sets: { load: number; reps: number }[] = [];
  for (const r of warmUp.ramp) {
    if (r.only_if && workingReps > 6) continue;
    const l = Math.floor((load * r.pct_working_load) / 100 / step) * step;
    if (sets.at(-1)?.load !== l) sets.push({ load: l, reps: r.reps });
  }
  return sets;
}
