// View-model helpers for screen stories: fixtures + vpt data → what each screen shows.
// Stories only. Rules come from @tare/engine, the same code the app runs.
import { displayName, exercise, safetyRule } from '@tare/data';
import { swapOptions, swapStartLoad } from '@tare/engine';
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

/** Start load for a swap as the sheet shows it (the engine's tr.global.swap_starting_load). */
export function swapStart(fromId: string, toId: string, workingLoad: number): string {
  const r = swapStartLoad({ fromId, toId, workingLoad });
  if (r.kind === 'bodyweight') return 'BW';
  if (r.kind === 'calibrate') return 'Easy first set';
  return `${r.load} kg${r.perHand ? ' per hand' : ''}`;
}

/** Swaps for an exercise, filtered by the user's kit and can't-do list, best first. */
export function swapsFor(exerciseId: string) {
  return swapOptions(exerciseId, profile).map((s) => ({
    ...s,
    name: name(s.id),
    pattern: pattern(s.id),
    reason: SWAP_REASON[s.reason] ?? s.reason,
  }));
}

export { safetyRule, weekdayOf };
