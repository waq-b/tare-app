// What a planned session looks like on screen: name, pattern, prescription and subline per
// exercise. Loads come in from the caller (last working load, else start load, #70).
import { displayName, exercise } from '@tare/data';
import { needsWarmUp } from '@tare/engine';
import type { MovementPattern } from '@tare/icons';
import { conventionSuffix, rxText, type LoadConvention } from '@tare/ui';
import type { Target } from '../data/hooks.ts';
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
  /** The load is a suggestion from body stats, not a logged or typed weight. */
  estimated: boolean;
  planned: PlannedExercise;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function sessionItems(
  session: PlannedSession,
  targets: Readonly<Record<string, Target>>,
): SessionItem[] {
  const warmed = new Set<string>();
  return session.exercises.map((pe) => {
    const ex = exercise(pe.exerciseId);
    const convention = ex.load_convention as LoadConvention;
    const target = targets[pe.exerciseId];
    const load = target?.load ?? null;
    const estimated = target?.source === 'estimate';
    const bodyweight = convention === 'bodyweight';
    const warm = needsWarmUp(pe.exerciseId, warmed);
    warmed.add(ex.movement_pattern);
    const subline =
      load === null && !bodyweight
        ? 'Easy first set to find your weight'
        : estimated
          ? target?.stackDependent
            ? 'Estimated from your body stats · a rough guide'
            : 'Estimated from your body stats'
          : warm
            ? 'Warm-up sets included'
            : cap(conventionSuffix(convention)) || undefined;
    return {
      exerciseId: pe.exerciseId,
      name: displayName(ex),
      pattern: ex.movement_pattern as MovementPattern,
      rx: rxText(pe.sets, repsText(pe.repRange), bodyweight ? null : load, convention),
      subline,
      load,
      estimated,
      planned: pe,
    };
  });
}

/** Rough session length: sets × (about 45 s of work + planned rest), plus warm-ups. */
export function estimateMinutes(session: PlannedSession): number {
  const sec = session.exercises.reduce((t, e) => t + e.sets * (45 + e.restSec), 0);
  return Math.max(5, Math.round((sec / 60 + 5) / 5) * 5);
}
