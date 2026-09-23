// What each planned exercise aims for today, and why (P1 T8). Pure: a snapshot of the log, the
// plan, the rules' changes and the flags in; targets out. Order of the rules:
//   1. progression from the log (pr.double_progression / pr.two_for_two); no log yet → the plan's
//      start weight → a suggestion from body stats (tr.global.starting_load) → an easy set
//   2. an applied increase the user undid holds last session's load
//   3. an accepted stall reset (pr.stall) sets the load
//   4. the new-user ramp (pr.new_user_ramp) trims sets
//   5. an accepted deload this week (pr.deload) cuts sets and eases effort
//   6. the first session back after a cleared flag (safety engine actions)
import { exercisesLoading } from '@tare/data';
import {
  deloadPrescription,
  nextTarget,
  rampSets,
  returnAfterFlag,
  type Block,
  type BodyStats,
  type KitLoad,
  type LoggedSession,
} from '@tare/engine';
import type { ChangeRecord, PainFlag, PlannedExercise } from '../db/index.ts';
import { estimateFor } from '../lib/estimate.ts';

export type DiffKind = 'increase' | 'undone' | 'reset' | 'deload' | 'return';

export interface ExerciseTarget {
  exerciseId: string;
  load: number | null;
  reps: number;
  sets: number;
  /** Where the load came from. */
  source: 'log' | 'plan' | 'estimate' | null;
  estimated: boolean;
  stackDependent: boolean;
  /** What changed against last time, with the rules behind it. */
  diff: { kind: DiffKind; from: { load: number | null; sets: number }; ruleIds: string[] } | null;
  /** The rules shaping today beyond the load (ramp, deload, DOMS). */
  notes: ('ramp' | 'deload' | 'no_hard_sets')[];
  ruleIds: string[];
}

export interface TargetInput {
  planned: PlannedExercise;
  /** This exercise's finished sessions, oldest first. */
  sessions: readonly LoggedSession[];
  goalId: string;
  level: 'beginner' | 'intermediate';
  maxRpe: number | null;
  kit: KitLoad;
  stats: BodyStats | null;
  block: Block;
  /** Monday of this week. */
  weekStart: string;
  changes: readonly ChangeRecord[];
  flags: readonly PainFlag[];
}

const after = (date: string | undefined) => (c: { date: string }) => !date || c.date > date;

export function exerciseTarget(t: TargetInput): ExerciseTarget {
  const { planned: p } = t;
  const id = p.exerciseId;
  const lastDate = t.sessions.at(-1)?.date;
  const ruleIds = new Set<string>();
  const notes: ExerciseTarget['notes'] = [];
  let diff: ExerciseTarget['diff'] = null;

  // 1. Progression, or the first weight.
  const next = nextTarget({
    exerciseId: id,
    goalId: t.goalId,
    level: t.level,
    repRange: p.repRange,
    sessions: t.sessions,
    step: t.kit.step,
    maxRpe: t.maxRpe,
  });
  let load: number | null;
  let reps = next.reps;
  let source: ExerciseTarget['source'];
  let estimated = false;
  let stackDependent = false;
  if (next.load !== null) {
    load = next.load;
    source = 'log';
    next.ruleIds.forEach((r) => ruleIds.add(r));
    if (next.change === 'increase' && next.from) {
      diff = {
        kind: 'increase',
        from: { load: next.from.load, sets: p.sets },
        ruleIds: next.ruleIds,
      };
    }
  } else if (p.startLoad !== null) {
    load = p.startLoad;
    source = 'plan';
  } else {
    const e = estimateFor(id, p.repRange[0], t.stats, t.kit);
    load = e?.load ?? null;
    source = load === null ? null : 'estimate';
    estimated = load !== null;
    stackDependent = e !== null && 'stackDependent' in e && e.stackDependent;
    if (estimated && e) e.ruleIds.forEach((r) => ruleIds.add(r));
  }

  const mine = t.changes.filter((c) => c.exerciseId === id && after(lastDate)(c));
  // 2. An increase the user undid: hold last session's load and reps.
  if (diff?.kind === 'increase' && next.from) {
    const undone = mine.find(
      (c) => c.kind === 'progression' && c.status === 'undone' && c.to['load'] === load,
    );
    if (undone) {
      load = next.from.load;
      reps = next.from.reps;
      diff = { kind: 'undone', from: diff.from, ruleIds: next.ruleIds };
    }
  }

  // 3. An accepted stall reset.
  const reset = mine.find(
    (c) => c.kind === 'stall' && c.status === 'accepted' && c.to['load'] != null,
  );
  if (reset) {
    diff = { kind: 'reset', from: { load, sets: p.sets }, ruleIds: reset.ruleIds };
    load = reset.to['load'] ?? load;
    reps = p.repRange[0];
    reset.ruleIds.forEach((r) => ruleIds.add(r));
  }

  // 4. The new-user ramp.
  let sets = p.sets;
  if (t.block.ramp) {
    sets = rampSets(t.goalId, p.sets);
    notes.push('ramp');
    ruleIds.add('pr.new_user_ramp');
  }

  // 5. An accepted deload this week.
  const deload = t.changes.find(
    (c) => c.kind === 'deload' && c.status === 'accepted' && c.date >= t.weekStart,
  );
  if (deload) {
    const d = deloadPrescription(sets, load, t.kit.step);
    diff = { kind: 'deload', from: { load, sets }, ruleIds: d.ruleIds };
    sets = d.sets;
    load = d.load;
    notes.push('deload');
    ruleIds.add('pr.deload');
  }

  // 6. First session back after a cleared flag on an area this exercise loads.
  const back = t.flags.find(
    (f) =>
      f.status === 'cleared' &&
      f.area &&
      f.clearedOn &&
      (!lastDate || f.clearedOn >= lastDate) &&
      exercisesLoading(f.area, 'primary').includes(id),
  );
  if (back && t.sessions.length) {
    const r = returnAfterFlag({ ruleId: back.ruleId, lastLoad: load, sets, step: t.kit.step });
    if (r.ruleIds.length && (r.load !== load || r.sets !== sets)) {
      diff = { kind: 'return', from: { load, sets }, ruleIds: r.ruleIds };
      load = r.load;
      sets = r.sets;
      r.ruleIds.forEach((x) => ruleIds.add(x));
    }
  }
  const doms = t.flags.some(
    (f) =>
      f.status === 'active' &&
      f.ruleId === 'doms_normal' &&
      f.area &&
      exercisesLoading(f.area, 'primary').includes(id),
  );
  if (doms) {
    notes.push('no_hard_sets');
    ruleIds.add('doms_normal');
  }

  return {
    exerciseId: id,
    load,
    reps,
    sets,
    source,
    estimated,
    stackDependent,
    diff,
    notes,
    ruleIds: [...ruleIds],
  };
}
