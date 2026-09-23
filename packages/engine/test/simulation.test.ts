// 8 weeks through the engine: a model lifter who gets stronger for 3 weeks, has one Hard
// session in week 5, then stops improving (a stall). Every session's targets, the stall steps
// and deload calls are checked against a golden file (__snapshots__), plus invariants.
import { describe, expect, it } from 'vitest';
import {
  blockOf,
  deloadDue,
  isStalled,
  nextTarget,
  stallStep,
  type Effort,
  type LoggedSession,
} from '../src/index.ts';

const DAYS = [0, 2, 4]; // Tue, Thu, Sat from a Tuesday start
const START = '2026-09-01';
const addDays = (iso: string, n: number) =>
  new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

const LIFTS = [
  { id: 'Barbell_Squat', start: 60, e1rm: 90, step: 2.5 },
  { id: 'Barbell_Bench_Press_-_Medium_Grip', start: 40, e1rm: 60, step: 2.5 },
];
const REP_RANGE = [6, 10] as const;

/** Reps the model can do at a load: inverse Epley on its e1RM, capped at the range top. */
const canDo = (e1rm: number, load: number) =>
  Math.max(0, Math.min(REP_RANGE[1], Math.floor(30 * (e1rm / load - 1))));

function simulate() {
  const history: Record<string, LoggedSession[]> = {};
  const trace: unknown[] = [];
  for (let week = 1; week <= 8; week++) {
    for (const d of DAYS) {
      const date = addDays(START, (week - 1) * 7 + d);
      const row: Record<string, unknown> = { date, week };
      for (const l of LIFTS) {
        const sessions = history[l.id] ?? [];
        const t = nextTarget({
          exerciseId: l.id,
          goalId: 'tr.goal.fat_loss',
          level: 'beginner',
          repRange: REP_RANGE,
          sessions,
          step: l.step,
          maxRpe: null,
        });
        const load = t.load ?? l.start;
        // Stronger by 1.5% a week for 3 weeks, then flat.
        const e1rm = l.e1rm * 1.015 ** Math.min(week - 1, 3);
        const reps = Math.min(canDo(e1rm, load), Math.max(t.reps, REP_RANGE[0]));
        const effort: Effort = week === 5 && d === 0 ? 'hard' : 'ok';
        const logged: LoggedSession = { date, sets: [0, 1, 2].map(() => ({ load, reps, effort })) };
        history[l.id] = [...sessions, logged];
        row[l.id] = { load, reps, change: t.change };
        row[`${l.id}:stalled`] = isStalled(history[l.id]!);
        const step = stallStep({
          sessions: history[l.id]!,
          poorRecovery: false,
          resetsBefore: 0,
          step: l.step,
        });
        if (step) row[`${l.id}:stall`] = step.step;
      }
      const stalled = LIFTS.filter((l) => isStalled(history[l.id] ?? [])).length;
      row['deload'] = deloadDue({
        block: blockOf(START, date),
        stalledThisWeek: stalled,
        sessions: [],
        today: date,
      }).why;
      trace.push(row);
    }
  }
  return { trace, history };
}

describe('8-week simulation', () => {
  const { trace, history } = simulate();

  it('matches the golden trace', () => {
    expect(trace).toMatchSnapshot();
  });

  it('loads only go up, and only after two top-of-range sessions at the same load', () => {
    for (const l of LIFTS) {
      const s = history[l.id]!;
      for (let i = 1; i < s.length; i++) {
        const [prev, cur] = [s[i - 1]!.sets[0]!.load, s[i]!.sets[0]!.load];
        expect(cur).toBeGreaterThanOrEqual(prev);
        if (cur > prev) {
          const [a, b] = [s[i - 2]!, s[i - 1]!];
          expect(a.sets[0]!.load).toBe(prev);
          expect(a.sets.every((x) => x.reps >= REP_RANGE[1])).toBe(true);
          expect(b.sets.every((x) => x.reps >= REP_RANGE[1])).toBe(true);
        }
      }
    }
  });

  it('the model stops improving after week 3, and the engine calls the stall', () => {
    const late = trace.slice(-3) as Record<string, unknown>[];
    expect(
      late.some(
        (r) =>
          r['Barbell_Squat:stalled'] === true ||
          r['Barbell_Bench_Press_-_Medium_Grip:stalled'] === true,
      ),
    ).toBe(true);
  });
});
