// The next target for an exercise from its logged sessions (pr.double_progression,
// pr.two_for_two). Pure: the log in, a target out, with the rule IDs it used and what changed.
// Effort: tr.global.effort_set_map; the target is the goal's intensity_rpe, capped by the
// screening's max_rpe. A set with no effort tapped counts as OK (decision #89).
import { doubleProgressionRule, exercise, goal, rule, twoForTwoRule } from '@tare/data';

export type Effort = 'easy' | 'ok' | 'hard' | null;

export interface LoggedSession {
  date: string;
  /** Working sets in the order logged. */
  sets: readonly { load: number; reps: number; effort: Effort }[];
}

export interface ProgressionInput {
  exerciseId: string;
  goalId: string;
  level: 'beginner' | 'intermediate';
  repRange: readonly [number, number];
  /** This exercise's sessions, oldest first. */
  sessions: readonly LoggedSession[];
  /** The smallest jump the user's kit allows for this exercise. */
  step: number;
  /** From screening (sf.screening), or null for no cap. */
  maxRpe: number | null;
}

export type ProgressionChange = 'none' | 'increase' | 'reps_up' | 'hold';

export interface ProgressionTarget {
  /** kg, or null when there's no log yet (the caller uses the start or suggested weight). */
  load: number | null;
  reps: number;
  change: ProgressionChange;
  /** Last session's working load and lowest reps, to show what changed. */
  from: { load: number; reps: number } | null;
  method: 'pr.double_progression' | 'pr.two_for_two';
  ruleIds: string[];
}

type EffortMap = Record<'easy' | 'ok' | 'hard', { rpe: [number, number] }>;

export function methodFor(goalId: string): ProgressionTarget['method'] {
  const key = (goal(goalId) as { goal: string }).goal;
  if (twoForTwoRule().default_for.includes(key)) return 'pr.two_for_two';
  if (doubleProgressionRule().default_for.includes(key)) return 'pr.double_progression';
  throw new Error(`progression: no method for goal ${goalId}`);
}

/** The highest RPE a set may be logged at and still count towards a load increase. */
export function targetRpe(goalId: string, maxRpe: number | null): number {
  const [, hi] = (goal(goalId) as unknown as { intensity_rpe: [number, number] }).intensity_rpe;
  return Math.min(hi, maxRpe ?? Infinity);
}

/** Whether a set's effort is at or below the target: Hard never is; an untapped set is OK. */
export function qualifies(effort: Effort, target: number): boolean {
  if (effort === 'hard') return false;
  const map = rule('tr.global.effort_set_map').raw['value'] as EffortMap;
  return map[effort ?? 'ok'].rpe[0] <= target;
}

const clamp = (n: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, n));
const ceilTo = (n: number, step: number) => Math.ceil(n / step - 1e-9) * step;
const topLoad = (s: LoggedSession) => Math.max(...s.sets.map((x) => x.load));

export function nextTarget(input: ProgressionInput): ProgressionTarget {
  const method = methodFor(input.goalId);
  const ruleIds = [method, 'tr.global.effort_set_map'];
  const [lo, hi] = input.repRange;
  const done = input.sessions.filter((s) => s.sets.length > 0);
  const last = done.at(-1);
  if (!last) return { load: null, reps: lo, change: 'none', from: null, method, ruleIds };

  const load = topLoad(last);
  const lastReps = Math.min(...last.sets.map((x) => x.reps));
  const from = { load, reps: lastReps };
  // Only the latest run of sessions at this load counts ("in N consecutive sessions").
  const atLoad: LoggedSession[] = [];
  for (const s of [...done].reverse()) {
    if (topLoad(s) !== load) break;
    atLoad.unshift(s);
  }
  const target = targetRpe(input.goalId, input.maxRpe);
  const cls = exercise(input.exerciseId).increment_class === 'lower' ? 'lower' : 'upper';

  if (method === 'pr.double_progression') {
    const r = doubleProgressionRule();
    const hit = (s: LoggedSession) =>
      s.sets.every((x) => x.reps >= hi && qualifies(x.effort, target));
    const recent = atLoad.slice(-r.sessions);
    if (recent.length >= r.sessions && recent.every(hit)) {
      const inc = Math.max((load * r.increment_pct[cls]) / 100, r.increment_kg_min[cls]);
      return {
        load: ceilTo(load + inc, input.step),
        reps: lo,
        change: 'increase',
        from,
        method,
        ruleIds,
      };
    }
    // Not yet: one more rep on the same load, unless a set was too hard (then hold).
    const tooHard = last.sets.some((x) => !qualifies(x.effort, target));
    const reps = clamp(tooHard ? lastReps : lastReps + 1, input.repRange);
    return { load, reps, change: reps > lastReps ? 'reps_up' : 'hold', from, method, ruleIds };
  }

  const r = twoForTwoRule();
  const lastSetOver = (s: LoggedSession) => {
    const final = s.sets.at(-1);
    return final !== undefined && final.reps >= lo + r.repsOver && qualifies(final.effort, target);
  };
  const recent = atLoad.slice(-r.sessions);
  if (recent.length >= r.sessions && recent.every(lastSetOver)) {
    const [inc] = r.increment_kg[cls][input.level === 'beginner' ? 'novice' : 'trained'];
    return {
      load: ceilTo(load + inc, input.step),
      reps: lo,
      change: 'increase',
      from,
      method,
      ruleIds,
    };
  }
  return { load, reps: lo, change: 'hold', from, method, ruleIds };
}
