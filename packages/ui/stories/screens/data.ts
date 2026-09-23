// View-model helpers for screen stories: fixtures + vpt data → what each screen shows.
// Stories only. The app computes these in P0/P1 with the real engine.
import { displayName, exercise, rule, safetyRule } from '@tare/data';
import type { MovementPattern } from '@tare/icons';
import {
  addDays,
  currentTarget,
  historyOf,
  plannedSession,
  profile,
  progressedLoad,
  review,
  shortDate,
  TODAY,
  warmUpSets,
  weekdayOf,
  WEEK1_MONDAY,
  CURRENT_WEEK,
  plan,
  sessions,
  needsWarmUp,
} from '../../fixtures';
import { conventionSuffix, rxText } from '../../src/lib/format';
import type { WeekDay } from '../../src/components/WeekStrip/WeekStrip';

export const name = (id: string) => displayName(exercise(id));
export const pattern = (id: string) => exercise(id).movement_pattern as MovementPattern;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const musclesLine = (id: string) => {
  const e = exercise(id);
  return cap([...e.primary_muscles, ...e.secondary_muscles].join(' · '));
};

/** Today's prescription for an exercise: the logged target, plus any accepted change. */
export function todayRx(
  exerciseId: string,
  sessionId: 'A' | 'B' | 'C' = 'B',
  /** Movement patterns already warmed up earlier in the session (tr.global.warm_up). */
  warmedPatterns: ReadonlySet<string> = new Set(),
) {
  const pe = plannedSession(sessionId).exercises.find((e) => e.exerciseId === exerciseId);
  if (!pe) throw new Error(`not in session ${sessionId}: ${exerciseId}`);
  const t = currentTarget(exerciseId);
  const accepted = review.changes.find(
    (c) => c.exerciseId === exerciseId && c.state === 'accepted' && c.kind === 'progress',
  );
  const load = accepted ? progressedLoad(exerciseId, t.load) : t.load;
  const reps = accepted ? pe.repRange[0] : t.reps;
  const ex = exercise(exerciseId);
  return {
    exerciseId,
    sets: pe.sets,
    reps,
    load,
    convention: ex.load_convention,
    changed: Boolean(accepted),
    rx: rxText(pe.sets, reps, load, ex.load_convention),
    subline: needsWarmUp(exerciseId, warmedPatterns)
      ? 'Warm-up sets included'
      : cap(conventionSuffix(ex.load_convention)) || undefined,
  };
}

export const sessionB = plannedSession('B');
const warmed = new Set<string>();
export const todayList = sessionB.exercises.map((e) => {
  const rx = todayRx(e.exerciseId, 'B', warmed);
  warmed.add(exercise(e.exerciseId).movement_pattern);
  return rx;
});
export const bench = todayList[0]!;
export const benchWarmups = warmUpSets(bench.exerciseId, bench.load, bench.reps);

/** Last time for an exercise, as "60 × 10 · 10 · 10", its date and last set's effort. */
export function lastTime(exerciseId: string) {
  const h = historyOf(exerciseId).at(-1);
  const work = (h?.sets ?? []).filter((s) => s.kind === 'work');
  const first = work[0];
  return {
    sets: first ? `${first.load} × ${work.map((w) => w.reps).join(' · ')}` : '—',
    date: h ? shortDate(h.date) : '',
    effort:
      work.at(-1)?.effort === 'hard' ? 'Hard' : work.at(-1)?.effort === 'easy' ? 'Easy' : 'OK',
    target: first ? `${first.load}×${first.reps}` : '',
  };
}

/** This week for the WeekStrip: Monday of the current week onward. */
export function thisWeek(opts: { today?: string; deload?: boolean } = {}): WeekDay[] {
  const today = opts.today ?? TODAY;
  const monday = addDays(WEEK1_MONDAY, (CURRENT_WEEK - 1) * 7);
  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return letters.map((letter, i) => {
    const date = addDays(monday, i);
    const planned = plan.find((p) => p.weekday === i);
    const done = sessions.some((s) => s.date === date);
    const state = done
      ? 'done'
      : planned
        ? opts.deload
          ? 'deload'
          : 'planned'
        : i === 4
          ? 'ride'
          : 'rest';
    return {
      letter,
      name: `${names[i]} ${Number(date.slice(8))} September`,
      date: Number(date.slice(8)),
      state,
      today: date === today,
    } as WeekDay;
  });
}

/** Human names for vpt swap reasons (UI copy mapped from the enum). */
export const SWAP_REASON: Record<string, string> = {
  same_pattern_diff_kit: 'Same movement, different kit',
  easier_regression: 'An easier version',
  harder_progression: 'A harder version',
  same_muscle: 'Works the same muscles',
};

/** Estimated start load for a swap, per tr.global.swap_starting_load, or a calibration set. */
export function swapStart(fromId: string, toId: string, workingLoad: number): string {
  const rule0 = rule('tr.global.swap_starting_load').raw['value'] as {
    safety_margin: number;
    ratios: {
      from: string;
      to: string;
      ratio_per_hand?: number;
      ratio?: number;
      patterns?: string[];
    }[];
  };
  const from = exercise(fromId);
  const to = exercise(toId);
  if (to.load_convention === 'bodyweight') return 'BW';
  const toKit = to.equipment_detail.includes('smith_machine')
    ? 'smith_machine'
    : to.load_convention === 'per_hand'
      ? 'dumbbell'
      : to.equipment[0];
  const r = rule0.ratios.find(
    (x) =>
      x.from === from.equipment[0] &&
      x.to === toKit &&
      (!x.patterns || x.patterns.includes(to.movement_pattern)),
  );
  if (!r) return 'Easy first set';
  const factor = (r.ratio_per_hand ?? r.ratio ?? 1) * rule0.safety_margin;
  const step = to.load_convention === 'per_hand' ? 2 : 2.5;
  const load = Math.floor((workingLoad * factor) / step) * step;
  return `${load} kg${to.load_convention === 'per_hand' ? ' per hand' : ''}`;
}

/** Swaps for an exercise, filtered by the user's kit and can't-do list, best first. */
export function swapsFor(exerciseId: string) {
  return exercise(exerciseId)
    .swaps.filter((s) => {
      const e = exercise(s.id);
      return (
        e.equipment_detail.every((t) => profile.kit.includes(t)) &&
        !e.skill_tags.some((t) => profile.cantDo.includes(t))
      );
    })
    .map((s) => ({
      ...s,
      name: name(s.id),
      pattern: pattern(s.id),
      reason: SWAP_REASON[s.reason] ?? s.reason,
    }));
}

export { safetyRule, weekdayOf };
