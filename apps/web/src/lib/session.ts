// What a planned session looks like on screen: name, pattern, prescription and subline per
// exercise. Loads come in from the caller (last working load, else start load, #70).
import { displayName, exercise } from '@tare/data';
import { needsWarmUp } from '@tare/engine';
import type { MovementPattern } from '@tare/icons';
import { conventionSuffix, rxText, type LoadConvention } from '@tare/ui';
import type { ExerciseTarget } from '../plan/targets.ts';
import type { PlanRecord, PlannedExercise } from '../db/index.ts';

export type PlannedSession = PlanRecord['sessions'][number];

export const nameOf = (id: string) => displayName(exercise(id));
export const patternOf = (id: string) => exercise(id).movement_pattern as MovementPattern;

export const repsText = ([lo, hi]: readonly [number, number]) =>
  lo === hi ? `${lo}` : `${lo}–${hi}`;

export interface SessionItem {
  exerciseId: string;
  name: string;
  pattern: MovementPattern;
  rx: string;
  subline: string | undefined;
  /** kg (per hand for dumbbells), or null for an easy first set. */
  load: number | null;
  reps: number;
  sets: number;
  /** The load is a suggestion from body stats, not a logged or typed weight. */
  estimated: boolean;
  /** A compact chip for what changed today (+2.5, Deload), with its tone. */
  chip: { to: string; tone: 'progress' | 'hold' | 'deload' | 'swap' } | null;
  target: ExerciseTarget;
  planned: PlannedExercise;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const kg = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ''));

function chipOf(t: ExerciseTarget): SessionItem['chip'] {
  const d = t.diff;
  if (!d) return null;
  if (d.kind === 'increase' && t.load !== null && d.from.load !== null) {
    return { to: `+${kg(t.load - d.from.load)}`, tone: 'progress' };
  }
  if (d.kind === 'reset' && t.load !== null && d.from.load !== null) {
    return { to: `−${kg(d.from.load - t.load)}`, tone: 'hold' };
  }
  if (d.kind === 'deload') return { to: 'Deload', tone: 'deload' };
  if (d.kind === 'return') return { to: 'Lighter', tone: 'swap' };
  return null;
}

export function sessionItems(
  session: PlannedSession,
  targets: Readonly<Record<string, ExerciseTarget>>,
): SessionItem[] {
  const warmed = new Set<string>();
  return session.exercises.flatMap((pe) => {
    const t = targets[pe.exerciseId];
    if (!t) return [];
    const ex = exercise(pe.exerciseId);
    const convention = ex.load_convention as LoadConvention;
    const bodyweight = convention === 'bodyweight';
    const warm = needsWarmUp(pe.exerciseId, warmed);
    warmed.add(ex.movement_pattern);
    const reps = t.source === 'log' ? String(t.reps) : repsText(pe.repRange);
    const subline = t.notes.includes('deload')
      ? 'Deload week: fewer sets, easier effort'
      : t.diff?.kind === 'return'
        ? 'Back after a pain flag, lighter'
        : t.load === null && !bodyweight
          ? 'Easy first set to find your weight'
          : t.estimated
            ? t.stackDependent
              ? 'Estimated from your body stats · a rough guide'
              : 'Estimated from your body stats'
            : t.notes.includes('ramp')
              ? 'Finding your weights: Easy or OK'
              : warm
                ? 'Warm-up sets included'
                : cap(conventionSuffix(convention)) || undefined;
    return [
      {
        exerciseId: pe.exerciseId,
        name: displayName(ex),
        pattern: ex.movement_pattern as MovementPattern,
        rx: rxText(t.sets, reps, bodyweight ? null : t.load, convention),
        subline,
        load: t.load,
        reps: t.reps,
        sets: t.sets,
        estimated: t.estimated,
        chip: chipOf(t),
        target: t,
        planned: pe,
      },
    ];
  });
}

/** Rough session length: sets × (about 45 s of work + planned rest), plus warm-ups. */
export function estimateMinutes(session: PlannedSession): number {
  const sec = session.exercises.reduce((t, e) => t + e.sets * (45 + e.restSec), 0);
  return Math.max(5, Math.round((sec / 60 + 5) / 5) * 5);
}
