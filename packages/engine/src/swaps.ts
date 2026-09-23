// Swap options: the exercise's curated swaps (exercises.json), filtered by the user's kit and
// "can't do yet" list at runtime (CLAUDE.md §9).
import { exercise } from '@tare/data';

export interface SwapFilter {
  /** enums.equipment_detail the user has. */
  kit: readonly string[];
  /** enums.skill_tags the user can't do yet. */
  cantDo: readonly string[];
}

export interface SwapOption {
  id: string;
  /** enums.swap_reason. */
  reason: string;
}

/** Swaps the user can do, in the data's order (best first). */
export function swapOptions(exerciseId: string, filter: SwapFilter): SwapOption[] {
  return exercise(exerciseId)
    .swaps.filter((s) => {
      const e = exercise(s.id);
      return (
        e.equipment_detail.every((t) => filter.kit.includes(t)) &&
        !e.skill_tags.some((t) => filter.cantDo.includes(t))
      );
    })
    .map((s) => ({ id: s.id, reason: s.reason }));
}
