// Rule values the fixtures use, read from vpt through @tare/data. Nothing here is hard-coded:
// if the data changes, the fixtures follow (and their tests say so).
import { exercise, goal, rule, vpt } from '@tare/data';
import {
  defaultLoadStep,
  e1rm as engineE1rm,
  needsWarmUp,
  warmUpSets as engineWarmUp,
} from '@tare/engine';

type Obj = Record<string, unknown>;
const value = (id: string) => rule(id).raw['value'] as Obj;

export const setCounting = value('tr.global.set_counting') as {
  primary: number;
  secondary: number;
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

/** Estimated 1RM per tr.global.e1rm (the engine's), or null outside the rule. */
export function e1rm(load: number, reps: number): number | null {
  return engineE1rm(load, reps)?.e1rm ?? null;
}

/** Smallest load step for an exercise's kit (the engine's default setting). */
export function loadStep(exerciseId: string): number {
  return defaultLoadStep(exercise(exerciseId));
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

export { needsWarmUp };

/** Warm-up ramp for a working set (the engine's tr.global.warm_up). Callers check
 * needsWarmUp first. */
export function warmUpSets(exerciseId: string, load: number, workingReps: number) {
  return engineWarmUp({ exerciseId, workingLoad: load, workingReps, patternsSoFar: new Set() })
    .sets;
}
