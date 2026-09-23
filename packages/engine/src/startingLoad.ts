// Suggested starting weights from body stats (tr.global.starting_load, vpt v0.1.3):
//   reference mass × 1RM ratio × age factor × staple factor × first-session % × safety margin,
//   rounded DOWN to the kit step, with the rule's below-lightest-load outcomes.
// Every number comes from the rule; this file only does the arithmetic. An estimate the user
// can change, labelled as one (the rule's first_session.label).
import { exercise, startingLoadRule, type StartingLoadRule } from '@tare/data';

export type Sex = 'male' | 'female' | 'prefer_not_to_say';
export type Level = 'beginner' | 'intermediate';

export interface BodyStats {
  sex: Sex;
  age: number;
  bodyweight: number;
  heightCm: number | null;
  level: Level;
}

/** The user's kit for one kind of load: smallest jump and lightest option (an app setting). */
export interface KitLoad {
  step: number;
  lightest: number;
}

export type KitKind = 'barbell' | 'dumbbell' | 'stack';

export type StartingLoad =
  | {
      outcome: 'estimate' | 'lightest_load';
      load: number;
      unrounded: number;
      /** Pulldowns and cable rows: a rough guide, the stack decides. */
      stackDependent: boolean;
      ruleIds: string[];
    }
  | {
      outcome: 'suggest_lighter_kit_or_calibrate' | 'calibrate';
      load: null;
      unrounded: number | null;
      /** Why there's no number (the rule's reason, or which input was missing). */
      reason: string;
      ruleIds: string[];
    };

const RULE = 'tr.global.starting_load';

/** Which kit setting an exercise's load is rounded to. */
export function kitKindOf(
  exerciseId: string,
  rule: StartingLoadRule = startingLoadRule(),
): KitKind {
  const ex = exercise(exerciseId);
  if (rule.staples[exerciseId]?.stack_dependent) return 'stack';
  if (ex.load_convention === 'per_hand') return 'dumbbell';
  if (ex.equipment.includes('machine') || ex.equipment.includes('cable')) return 'stack';
  return 'barbell';
}

export function ageFactor(age: number, rule: StartingLoadRule = startingLoadRule()): number | null {
  const bands = rule.age_factor.bands;
  const b =
    bands.find((x) => age >= x.from && age < x.to) ??
    (age === bands.at(-1)?.to ? bands.at(-1) : undefined);
  if (!b) return null;
  return b.factor_at_start + b.per_year * (age - b.from);
}

export function firstSessionPct(
  targetReps: number,
  level: Level,
  age: number,
  rule = startingLoadRule(),
) {
  const { cap } = rule.first_session_pct;
  const limit = age >= 65 ? cap.age_65_plus : cap[level];
  if (limit === undefined) throw new Error(`${RULE}: no first-session cap for ${level}`);
  return Math.min(1 / (1 + (targetReps + rule.firstSessionRir) / 30), limit);
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const floorTo = (n: number, step: number) => Math.floor(n / step + 1e-9) * step;

export function suggestStartingLoad(input: {
  exerciseId: string;
  stats: BodyStats;
  targetReps: number;
  kit: KitLoad;
  rule?: StartingLoadRule;
}): StartingLoad {
  const rule = input.rule ?? startingLoadRule();
  const ruleIds = [RULE];
  const { stats } = input;
  const calibrate = (reason: string): StartingLoad => ({
    outcome: 'calibrate',
    load: null,
    unrounded: null,
    reason,
    ruleIds,
  });

  const listed = rule.calibrate_instead.staples[input.exerciseId];
  if (listed) return calibrate(listed);
  const staple = rule.staples[input.exerciseId];
  if (!staple) return calibrate('not in the rule’s staples');
  const [minAge, maxAge] = rule.inputs.age.applies;
  if (stats.age < minAge || stats.age > maxAge) return calibrate('age outside the rule’s range');
  if (!(stats.bodyweight > 0)) return calibrate('no bodyweight');

  const sexKey = stats.sex === 'prefer_not_to_say' ? 'female' : stats.sex;
  const ratio = rule.ratio_1rm[sexKey]?.[stats.level]?.[staple.anchor];
  const age = ageFactor(stats.age, rule);
  if (ratio === undefined || age === null) return calibrate('no ratio for these inputs');

  const reference =
    stats.heightCm && stats.heightCm > 0
      ? Math.min(stats.bodyweight, rule.bmiCap * (stats.heightCm / 100) ** 2)
      : stats.bodyweight;
  const e1rm = reference * ratio * age * staple.factor;
  const exact =
    e1rm * firstSessionPct(input.targetReps, stats.level, stats.age, rule) * rule.safety_margin;
  const unrounded = round1(exact);
  const load = floorTo(exact, input.kit.step);
  const stackDependent = staple.stack_dependent === true;

  if (load >= input.kit.lightest) {
    return { outcome: 'estimate', load, unrounded, stackDependent, ruleIds };
  }
  // Below the lightest option (e.g. the empty bar): use it only if it's a small enough share
  // of the estimated 1RM; otherwise a lighter kit (a swap) or a calibration set.
  if (input.kit.lightest <= rule.lightestMaxPctOf1rm * e1rm) {
    return {
      outcome: 'lightest_load',
      load: input.kit.lightest,
      unrounded,
      stackDependent,
      ruleIds,
    };
  }
  return {
    outcome: 'suggest_lighter_kit_or_calibrate',
    load: null,
    unrounded,
    reason: 'lighter than the lightest option',
    ruleIds,
  };
}

/** First session only (the rule's first_session.after_set_1): the next set's load after an
 * estimated set, by its effort. Easy → up 5–10% (one or two kit steps); OK → keep; Hard →
 * down 10%. Returns the load and whether it changed. */
export function firstSessionNext(input: {
  load: number;
  effort: 'easy' | 'ok' | 'hard' | null;
  kit: KitLoad;
  rule?: StartingLoadRule;
}): { load: number; changed: boolean; ruleIds: string[] } {
  const rule = input.rule ?? startingLoadRule();
  const ruleIds = [RULE];
  const { load, kit } = input;
  if (input.effort === 'easy') {
    // Whole kit steps, at least the low end of the raise and no more than the high end;
    // one step when a single step is already bigger than that.
    const [lo, hi] = rule.afterEasyRaise;
    const most = Math.floor((load * hi) / kit.step + 1e-9) * kit.step;
    const least = Math.ceil((load * lo) / kit.step - 1e-9) * kit.step;
    const raise = Math.max(kit.step, Math.min(Math.max(least, kit.step), Math.max(most, kit.step)));
    return { load: load + raise, changed: true, ruleIds };
  }
  if (input.effort === 'hard') {
    const next = Math.max(kit.lightest, floorTo(load * (1 - rule.afterHardDrop), kit.step));
    return { load: next, changed: next !== load, ruleIds };
  }
  return { load, changed: false, ruleIds };
}
