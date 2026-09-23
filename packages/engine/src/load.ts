// Load maths: estimated 1RM, warm-up ramps, starting loads for a swap. Rule values come from
// vpt through @tare/data; the maths is ours and cites the rule it follows.
import { exercise, rule, type Exercise } from '@tare/data';

const value = <T>(id: string) => rule(id).raw['value'] as T;

/** The smallest jump the user's kit allows for this exercise (kg; per hand for dumbbells).
 * An app setting, not rule data: this is only the default until the user changes it. */
export function defaultLoadStep(ex: Pick<Exercise, 'load_convention'>): number {
  return ex.load_convention === 'per_hand' ? 2 : 2.5;
}

const roundDown = (load: number, step: number) => Math.floor(load / step + 1e-9) * step;

/** Estimated 1RM (tr.global.e1rm), or null for a set outside the rule's rep range. */
export function e1rm(load: number, reps: number): { e1rm: number; ruleIds: string[] } | null {
  const r = value<{ formula: string; max_reps: number }>('tr.global.e1rm');
  if (r.formula !== 'epley') throw new Error(`tr.global.e1rm: unsupported formula ${r.formula}`);
  if (!Number.isInteger(reps) || reps < 1 || reps > r.max_reps || load <= 0) return null;
  const est = reps === 1 ? load : Math.round(load * (1 + reps / 30) * 10) / 10;
  return { e1rm: est, ruleIds: ['tr.global.e1rm'] };
}

interface WarmUpRule {
  ramp: { pct_working_load: number; reps: number; only_if?: string }[];
}

/** Whether tr.global.warm_up applies: the first exercise of its movement pattern in the
 * session, when it's a compound lift with external load. */
export function needsWarmUp(exerciseId: string, patternsSoFar: ReadonlySet<string>): boolean {
  const ex = exercise(exerciseId);
  return (
    ex['mechanic'] === 'compound' &&
    ex.load_convention !== 'bodyweight' &&
    !patternsSoFar.has(ex.movement_pattern)
  );
}

/** Warm-up ramp for a working load (tr.global.warm_up): each step rounded down to the kit's
 * step, skipping a step that lands on the same load as the one before. Empty when the rule
 * doesn't apply. Warm-ups never count for volume or progression. */
export function warmUpSets(input: {
  exerciseId: string;
  workingLoad: number;
  workingReps: number;
  patternsSoFar: ReadonlySet<string>;
  step?: number;
}): { sets: { load: number; reps: number }[]; ruleIds: string[] } {
  if (!needsWarmUp(input.exerciseId, input.patternsSoFar)) return { sets: [], ruleIds: [] };
  const step = input.step ?? defaultLoadStep(exercise(input.exerciseId));
  const sets: { load: number; reps: number }[] = [];
  for (const r of value<WarmUpRule>('tr.global.warm_up').ramp) {
    // The only condition in the data today is "working reps <= 6".
    const cap = r.only_if?.match(/working reps <= (\d+)/)?.[1];
    if (r.only_if && (!cap || input.workingReps > Number(cap))) continue;
    const load = roundDown((input.workingLoad * r.pct_working_load) / 100, step);
    if (load > 0 && sets.at(-1)?.load !== load) sets.push({ load, reps: r.reps });
  }
  return { sets, ruleIds: ['tr.global.warm_up'] };
}

interface SwapRatio {
  from: string;
  to: string;
  ratio?: number;
  ratio_per_hand?: number;
  ratio_from_per_hand?: number;
  ratio_per_side?: number;
  patterns?: string[];
}

/** The kit family a ratio is written for. */
function kitOf(ex: Exercise): string {
  if (ex.equipment_detail.includes('smith_machine')) return 'smith_machine';
  if (ex.load_convention === 'per_hand') return 'dumbbell';
  return ex.equipment[0] ?? 'other';
}

export type SwapStart =
  | { kind: 'load'; load: number; perHand: boolean; ruleIds: string[] }
  | { kind: 'bodyweight'; ruleIds: string[] }
  | { kind: 'calibrate'; ruleIds: string[] };

/** Starting load after a swap (tr.global.swap_starting_load): ratio × safety margin, rounded
 * down. Where no ratio applies, a light calibration set instead (`calibrate_instead`). */
export function swapStartLoad(input: {
  fromId: string;
  toId: string;
  workingLoad: number;
  step?: number;
}): SwapStart {
  const ruleIds = ['tr.global.swap_starting_load'];
  const r = value<{ safety_margin: number; ratios: SwapRatio[] }>('tr.global.swap_starting_load');
  const from = exercise(input.fromId);
  const to = exercise(input.toId);
  if (to.load_convention === 'bodyweight') return { kind: 'bodyweight', ruleIds };
  const [fk, tk] = [kitOf(from), kitOf(to)];
  const fits = (x: SwapRatio) => !x.patterns || x.patterns.includes(to.movement_pattern);
  const sameKitUnilateral = fk === tk && !from.unilateral && to.unilateral;
  const ratio =
    from.movement_pattern !== to.movement_pattern
      ? undefined
      : sameKitUnilateral
        ? r.ratios.find((x) => x.from === 'bilateral' && x.to === 'unilateral')
        : r.ratios.find((x) => x.from === fk && x.to === tk && fits(x));
  if (!ratio) return { kind: 'calibrate', ruleIds };
  const factor =
    ratio.ratio_per_hand ?? ratio.ratio ?? ratio.ratio_from_per_hand ?? ratio.ratio_per_side ?? 1;
  const step = input.step ?? defaultLoadStep(to);
  const load = roundDown(input.workingLoad * factor * r.safety_margin, step);
  if (load <= 0) return { kind: 'calibrate', ruleIds };
  return { kind: 'load', load, perHand: to.load_convention === 'per_hand', ruleIds };
}
