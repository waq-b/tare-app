// pr.volume_progression: at a new block, add sets per muscle when recovery is good, never past
// the goal's weekly max. Offered as a change, not applied.
import { exercise, goal, progressionText, volumeProgressionRule } from '@tare/data';
import type { SessionFeel } from './block.ts';
import { weeklySets } from './volume.ts';

export interface PlanExercise {
  exerciseId: string;
  sets: number;
}

export interface VolumeCheck {
  ok: boolean;
  /** Which requirement failed. */
  blockedBy: 'pain_flags' | 'hard_sessions' | 'wrecked_sessions' | 'performance' | null;
}

export function volumeReady(input: {
  painFlagsInBlock: number;
  sessionsInBlock: readonly SessionFeel[];
  wreckedLast14Days: number;
  /** Lifts whose performance is stable or rising, out of those tracked. */
  liftsHolding: number;
  liftsTracked: number;
}): VolumeCheck {
  const r = volumeProgressionRule().requires_structured;
  if (input.painFlagsInBlock > r.pain_flags_in_block) return { ok: false, blockedBy: 'pain_flags' };
  if (input.wreckedLast14Days > r.wrecked_sessions_last_14_days_max) {
    return { ok: false, blockedBy: 'wrecked_sessions' };
  }
  const n = input.sessionsInBlock.length;
  const hard = input.sessionsInBlock.filter(
    (s) => s.feel === 'tough' || s.feel === 'wrecked',
  ).length;
  if (n > 0 && hard / n > r.hard_session_share_max)
    return { ok: false, blockedBy: 'hard_sessions' };
  // "Stable or rising on most lifts".
  if (input.liftsTracked > 0 && input.liftsHolding * 2 <= input.liftsTracked) {
    return { ok: false, blockedBy: 'performance' };
  }
  return { ok: true, blockedBy: null };
}

/** Extra sets to offer: one set at a time, on the exercise that trains each muscle below the
 * goal's weekly max, until each gains the rule's minimum, without any muscle passing the max. */
export function volumeProposal(input: {
  goalId: string;
  level: 'beginner' | 'intermediate';
  /** Every planned exercise across the week (repeat an exercise per session it's in). */
  week: readonly PlanExercise[];
}) {
  const g = goal(input.goalId) as unknown as {
    weekly_sets_per_muscle: Record<string, { max: number }>;
    sets_per_exercise: [number, number];
  };
  const band = g.weekly_sets_per_muscle[input.level];
  const perExerciseMax = g.sets_per_exercise[1];
  if (!band) return { changes: [], ruleIds: ['pr.volume_progression'] };
  const [add] = progressionText().volumeAdd;
  const plan = input.week.map((e) => ({ ...e }));
  const start = weeklySets(plan).perMuscle;
  const gained: Record<string, number> = {};
  const extra = new Map<number, number>();

  for (const muscle of Object.keys(start).sort()) {
    while ((gained[muscle] ?? 0) < add) {
      const now = weeklySets(plan).perMuscle;
      if ((now[muscle] ?? 0) + 1 > band.max) break;
      // The exercise that trains this muscle as primary with the fewest sets.
      const candidates = plan
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => exercise(e.exerciseId).primary_muscles.includes(muscle))
        .sort((a, b) => a.e.sets - b.e.sets);
      const pick = candidates.find(({ e }) => {
        if (e.sets + 1 > perExerciseMax) return false;
        const ex = exercise(e.exerciseId);
        return [...ex.primary_muscles, ...ex.secondary_muscles].every(
          (m) => (now[m] ?? 0) + 1 <= band.max,
        );
      });
      if (!pick) break;
      pick.e.sets += 1;
      extra.set(pick.i, (extra.get(pick.i) ?? 0) + 1);
      const after = weeklySets(plan).perMuscle;
      for (const m of Object.keys(after)) gained[m] = (after[m] ?? 0) - (start[m] ?? 0);
    }
  }
  const changes = [...extra].flatMap(([i, n]) => {
    const e = input.week[i];
    return e ? [{ index: i, exerciseId: e.exerciseId, from: e.sets, to: e.sets + n }] : [];
  });
  return { changes, ruleIds: ['pr.volume_progression', 'tr.global.set_counting'] };
}
