// The weekly review written after week 8 (Sun 20 Sep). Week 8 is past the 4 weeks of logs
// that pr.new_user_ramp requires before any AI suggestion. Every change cites real rule IDs
// and is justified by the logs (checked in fixtures.test.ts).
import { dateOf } from './calendar';
import { weeklySets, weeklySetTarget } from './derived';
import { currentTarget, historyOf } from './logs';
import { plannedSession } from './plan';
import { progressedLoad } from './rules';
import type { ProposedChange, WeeklyReview } from './types';

const bench = 'Barbell_Bench_Press_-_Medium_Grip';
const inclineDb = 'Incline_Dumbbell_Press';
const pulldown = 'Wide-Grip_Lat_Pulldown';
const rdl = 'Romanian_Deadlift';
const hamstringSets = weeklySets(8)['hamstrings'] ?? 0;

const rx = (sets: number, reps: number, load: number, unit = '') =>
  `${sets} × ${reps} @ ${load}${unit}`;

/** A progress change under pr.double_progression: top of the range twice → more load, reps
 * back to the bottom. */
function progress(
  exerciseId: string,
  session: 'A' | 'B' | 'C',
  unit = '',
): Omit<ProposedChange, 'id' | 'state' | 'rationale'> {
  const pe = plannedSession(session).exercises.find((e) => e.exerciseId === exerciseId);
  if (!pe) throw new Error(`fixtures: ${exerciseId} not in session ${session}`);
  const { load } = currentTarget(exerciseId);
  const [lo, hi] = pe.repRange;
  return {
    kind: 'progress',
    exerciseId,
    from: rx(pe.sets, hi, load, unit),
    to: rx(pe.sets, lo, progressedLoad(exerciseId, load), unit),
    ruleIds: ['pr.double_progression'],
  };
}

const pulldownLoad = currentTarget(pulldown).load;
const pulldownReset = Math.floor((pulldownLoad * 0.9) / 2.5) * 2.5;

export const review: WeeklyReview = {
  week: 8,
  weekStart: dateOf(8, 0),
  weekEnd: dateOf(8, 6),
  sessionsDone: 3,
  sessionsPlanned: 3,
  summary:
    'A steady week: all three sessions done. Bench and incline press both topped out their rep ranges twice, so they can go up. Lat pulldown has been stuck for three weeks, and hamstrings get very little direct work.',
  writtenAt: '2026-09-20T19:02:00+01:00',
  changes: [
    {
      id: 'c1',
      ...progress(bench, 'B'),
      rationale:
        'All 3 sets hit 10 reps, the top of your 6–10 range, in your last two bench sessions.',
      state: 'accepted',
    },
    {
      id: 'c2',
      ...progress(inclineDb, 'B', ' per hand'),
      rationale: 'All 3 sets hit 12 reps, the top of your 8–12 range, two sessions running.',
      state: 'pending',
    },
    {
      id: 'c3',
      kind: 'hold',
      exerciseId: pulldown,
      from: `${pulldownLoad} kg`,
      to: `${pulldownReset} kg, then build back up`,
      rationale:
        'No progress in six sessions. Recovery looks fine, so the next step is a lighter reset.',
      ruleIds: ['pr.stall', 'pr.stall.step2'],
      state: 'kept',
      keepReason: 'dont_like',
    },
    {
      id: 'c4',
      kind: 'volume',
      exerciseId: rdl,
      from: 'Not in plan',
      to: '2 sets in Session A from the next block',
      rationale: `Hamstrings get about ${hamstringSets} sets a week, under your minimum of ${weeklySetTarget.min}. Extra sets are added at the start of a block.`,
      ruleIds: ['pr.volume_progression', 'tr.goal.fat_loss', 'tr.global.set_counting'],
      state: 'pending',
    },
  ],
};

/** History used to justify a progress change: the last two sessions for that exercise. */
export function lastTwo(exerciseId: string) {
  return historyOf(exerciseId)
    .filter((h) => !h.deload)
    .slice(-2);
}
