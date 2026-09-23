// The Ledger's state, worked out from the workout record and its logged sets. Pure: records in,
// what to show out. Warm-ups come from the engine (tr.global.warm_up); loads before P1 are the
// target the workout started with (#70); target reps follow last time, within the rep range.
import { exercise } from '@tare/data';
import { e1rm, warmUpSets } from '@tare/engine';
import type { SetRecord, WorkoutExercise, WorkoutRecord } from '../db/index.ts';

export interface WarmUpRow {
  index: number;
  load: number;
  reps: number;
  done: SetRecord | undefined;
}

export interface WorkRow {
  index: number;
  state: 'done' | 'current' | 'upcoming';
  load: number | null;
  reps: number;
  set: SetRecord | undefined;
}

export interface ExerciseView {
  ex: WorkoutExercise;
  position: number;
  warmups: WarmUpRow[];
  work: WorkRow[];
  /** The next working set to log, or null when the exercise is complete. */
  current: WorkRow | null;
  complete: boolean;
}

const clamp = (n: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, n));

/** Last time's working sets for an exercise (from the most recent finished workout), in order. */
export function lastSession(history: readonly SetRecord[]): SetRecord[] {
  const first = history[0];
  if (!first) return [];
  return history
    .filter((s) => s.workoutId === first.workoutId)
    .sort((a, b) => a.loggedAt - b.loggedAt);
}

export function targetReps(ex: WorkoutExercise, index: number, last: readonly SetRecord[]): number {
  const prev = last[index - 1] ?? last.at(-1);
  return prev ? clamp(prev.reps, ex.repRange) : ex.repRange[0];
}

export function exerciseView(
  workout: WorkoutRecord,
  position: number,
  sets: readonly SetRecord[],
  last: readonly SetRecord[],
): ExerciseView | null {
  const ex = workout.exercises[position];
  if (!ex) return null;
  const mine = sets
    .filter((s) => s.exerciseId === ex.exerciseId && !s.deleted)
    .sort((a, b) => a.loggedAt - b.loggedAt);
  const work = mine.filter((s) => s.kind === 'work');
  const warm = mine.filter((s) => s.kind === 'warmup');

  const patternsSoFar = new Set(
    workout.exercises
      .slice(0, position)
      .filter((e) => !e.skipped)
      .map((e) => exercise(e.exerciseId).movement_pattern),
  );
  const warmups =
    ex.load === null
      ? []
      : warmUpSets({
          exerciseId: ex.exerciseId,
          workingLoad: ex.load,
          workingReps: targetReps(ex, 1, last),
          patternsSoFar,
        }).sets.map((w, i) => ({ index: i + 1, ...w, done: warm[i] }));

  const count = Math.max(ex.sets, work.length);
  const rows: WorkRow[] = Array.from({ length: count }, (_, i) => {
    const set = work[i];
    if (set) return { index: i + 1, state: 'done', load: set.load, reps: set.reps, set };
    return {
      index: i + 1,
      state: i === work.length ? 'current' : 'upcoming',
      // After a logged set, the next one aims for the same weight.
      load: work.at(-1)?.load ?? ex.load,
      reps: targetReps(ex, i + 1, last),
      set: undefined,
    };
  });
  const current = rows.find((r) => r.state === 'current') ?? null;
  return { ex, position, warmups, work: rows, current, complete: current === null };
}

/** kg moved, counting both hands for dumbbells logged per hand. */
export function volumeOf(set: Pick<SetRecord, 'exerciseId' | 'load' | 'reps'>): number {
  const perHand = exercise(set.exerciseId).load_convention === 'per_hand';
  return set.load * set.reps * (perHand ? 2 : 1);
}

export interface FinishSummary {
  minutes: number;
  volume: number;
  sets: number;
  /** New best estimated 1RM (tr.global.e1rm) against every earlier finished workout. */
  prs: { exerciseId: string; today: number; before: number }[];
  /** First working set against last time's: more weight, or more reps at the same weight. */
  better: { exerciseId: string; before: string; after: string; delta: string }[];
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ''));

export function summarise(
  workout: WorkoutRecord,
  sets: readonly SetRecord[],
  /** Earlier working sets per exercise (finished workouts, newest first). */
  history: Readonly<Record<string, readonly SetRecord[]>>,
  now: number,
): FinishSummary {
  const work = sets.filter((s) => s.kind === 'work' && !s.deleted);
  const ids = [...new Set(work.map((s) => s.exerciseId))];
  const prs: FinishSummary['prs'] = [];
  const better: FinishSummary['better'] = [];
  for (const id of ids) {
    const today = work.filter((s) => s.exerciseId === id).sort((a, b) => a.loggedAt - b.loggedAt);
    const before = history[id] ?? [];
    const best = (xs: readonly SetRecord[]) =>
      Math.max(0, ...xs.map((s) => e1rm(s.load, s.reps)?.e1rm ?? 0));
    const [t, b] = [best(today), best(before)];
    if (before.length && t > b) prs.push({ exerciseId: id, today: t, before: b });

    const now1 = today[0];
    const last1 = lastSession(before)[0];
    if (now1 && last1) {
      if (now1.load > last1.load) {
        better.push({
          exerciseId: id,
          before: `${fmt(last1.load)} × ${last1.reps}`,
          after: `${fmt(now1.load)} × ${now1.reps}`,
          delta: `+${fmt(now1.load - last1.load)} kg`,
        });
      } else if (now1.load === last1.load && now1.reps > last1.reps) {
        const d = now1.reps - last1.reps;
        better.push({
          exerciseId: id,
          before: `${fmt(last1.load)} × ${last1.reps}`,
          after: `${fmt(now1.load)} × ${now1.reps}`,
          delta: `+${d} rep${d === 1 ? '' : 's'}`,
        });
      }
    }
  }
  return {
    minutes: Math.max(1, Math.round((now - workout.startedAt) / 60000)),
    volume: Math.round(work.reduce((v, s) => v + volumeOf(s), 0)),
    sets: work.length,
    prs,
    better,
  };
}
