// Raising a pain flag: the engine routes the answers to a safety rule, the flag is saved, and
// for pain_during_exercise the engine action is applied to the workout in progress. Nothing
// here can change a rule's action or message (hard line 3).
import { exercisesLoading, safetyRule } from '@tare/data';
import { modifyForPainFlag } from '@tare/engine';
import type { AppData } from '../data/DbContext.tsx';
import type { PainFlag, WorkoutRecord } from '../db/index.ts';

export interface FlagInput {
  ruleId: string;
  area: string | null;
  side: 'left' | 'right' | 'both' | null;
  date: string;
  workout: WorkoutRecord | null;
}

export async function raisePainFlag(data: AppData, input: FlagInput): Promise<PainFlag> {
  const rule = safetyRule(input.ruleId); // throws on an unknown rule
  const w = input.workout;
  const current = w?.exercises[w.current];
  let skipped: string[] = [];

  if (w && current && input.area && rule.action === 'modify_exercise') {
    const logged = await data.r.sets.forWorkout(w.id);
    const remaining = w.exercises.slice(w.current).filter((e) => !e.skipped);
    const m = modifyForPainFlag({
      area: input.area,
      current: current.exerciseId,
      remaining: remaining.map((e) => e.exerciseId),
    });
    const out = new Set([...(m.stop ? [m.stop] : []), ...m.skip]);
    skipped = [...out];
    const exercises = w.exercises.map((e, i) => {
      if (i < w.current || !out.has(e.exerciseId)) return e;
      const done = logged.filter((s) => s.exerciseId === e.exerciseId && s.kind === 'work').length;
      return { ...e, sets: done, skipped: done === 0 };
    });
    const next = exercises.findIndex((e, i) => i > w.current && !e.skipped);
    await data.r.workouts.update(w.id, {
      exercises,
      current: next === -1 ? w.current : next,
    });
  }

  return data.r.painFlags.raise({
    date: input.date,
    area: input.area,
    side: input.side,
    ruleId: rule.id,
    workoutId: w?.id ?? null,
    exerciseId: current?.exerciseId ?? null,
    skippedExerciseIds: skipped,
  });
}

/** Exercises to leave out while flags are active (their area as primary, body_area_map). */
export function avoidedFor(flags: readonly PainFlag[]): Set<string> {
  return new Set(
    flags
      .filter((f) => f.status === 'active' && f.area)
      .flatMap((f) => exercisesLoading(f.area as string, 'primary')),
  );
}
