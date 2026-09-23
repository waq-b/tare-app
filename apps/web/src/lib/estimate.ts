// Suggested starting weights for the user's plan, from their body stats. The engine does the
// maths from tr.global.starting_load; this only gathers the inputs.
import { suggestStartingLoad, type BodyStats, type KitLoad, type StartingLoad } from '@tare/engine';
import type { Profile } from '../db/index.ts';
import { kitFor } from '../settings/kit.ts';

export function bodyStatsOf(
  p: Pick<Profile, 'sex' | 'birthYear' | 'heightCm' | 'level'> | null | undefined,
  bodyweight: number | null,
  year: number,
): BodyStats | null {
  if (!p?.sex || !p.birthYear || !bodyweight) return null;
  return {
    sex: p.sex,
    age: year - p.birthYear,
    bodyweight,
    heightCm: p.heightCm ?? null,
    level: p.level,
  };
}

export function estimateFor(
  exerciseId: string,
  targetReps: number,
  stats: BodyStats | null,
  kit: KitLoad = kitFor(null, exerciseId),
): StartingLoad | null {
  if (!stats) return null;
  return suggestStartingLoad({
    exerciseId,
    stats,
    targetReps,
    kit,
  });
}
