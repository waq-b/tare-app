import { doubleProgressionRule, rule, twoForTwoRule } from '@tare/data';
import { describe, expect, it } from 'vitest';
import {
  methodFor,
  nextTarget,
  qualifies,
  targetRpe,
  type Effort,
  type LoggedSession,
} from '../src/index.ts';

const squat = 'Barbell_Squat'; // increment_class lower
const bench = 'Barbell_Bench_Press_-_Medium_Grip'; // upper
const dbPress = 'Incline_Dumbbell_Press'; // upper, per hand

const s = (date: string, load: number, reps: number[], effort: Effort = 'ok'): LoggedSession => ({
  date,
  sets: reps.map((r) => ({ load, reps: r, effort })),
});
const base = {
  goalId: 'tr.goal.fat_loss',
  level: 'beginner' as const,
  repRange: [6, 10] as const,
  step: 2.5,
  maxRpe: null,
};
const dp = doubleProgressionRule();

describe('method and effort', () => {
  it('fat loss uses double progression; strength uses 2-for-2 (default_for)', () => {
    expect(methodFor('tr.goal.fat_loss')).toBe('pr.double_progression');
    expect(methodFor('tr.goal.hypertrophy')).toBe('pr.double_progression');
    expect(methodFor('tr.goal.strength')).toBe('pr.two_for_two');
  });

  it('target RPE is the goal’s top, capped by screening', () => {
    expect(targetRpe('tr.goal.fat_loss', null)).toBe(9);
    expect(targetRpe('tr.goal.fat_loss', 7)).toBe(7);
  });

  it('Hard never counts; untapped counts as OK (decision #89); a cap of 7 still allows OK', () => {
    expect(qualifies('hard', 9)).toBe(false);
    expect(qualifies(null, 9)).toBe(true);
    expect(qualifies('ok', 7)).toBe(true);
    expect(qualifies('easy', 7)).toBe(true);
  });
});

describe('pr.double_progression', () => {
  it('no log yet: no load (caller uses start or suggested weight), bottom of the range', () => {
    expect(nextTarget({ ...base, exerciseId: squat, sessions: [] })).toMatchObject({
      load: null,
      reps: 6,
      change: 'none',
    });
  });

  it('adds a rep until the top of the range', () => {
    const t = nextTarget({
      ...base,
      exerciseId: squat,
      sessions: [s('2026-09-01', 60, [7, 7, 6])],
    });
    expect(t).toMatchObject({ load: 60, reps: 7, change: 'reps_up', from: { load: 60, reps: 6 } });
  });

  it('top of the range in one session isn’t enough', () => {
    const t = nextTarget({
      ...base,
      exerciseId: squat,
      sessions: [s('2026-09-01', 60, [10, 10, 10])],
    });
    expect(t).toMatchObject({ load: 60, change: 'hold', reps: 10 });
  });

  it(`top of the range in ${dp.sessions} sessions in a row → load up by the lower-body %, reps back to the bottom`, () => {
    const t = nextTarget({
      ...base,
      exerciseId: squat,
      sessions: [s('2026-09-01', 60, [10, 10, 10]), s('2026-09-03', 60, [10, 10, 10])],
    });
    // 60 × 5% = 3 (above the 2.5 minimum) → 63, rounded up to the 2.5 kg step → 65
    expect(t).toMatchObject({ load: 65, reps: 6, change: 'increase' });
    expect(t.ruleIds).toContain('pr.double_progression');
    for (const id of t.ruleIds) expect(() => rule(id)).not.toThrow();
  });

  it('upper body uses the upper %, at least its minimum', () => {
    const t = nextTarget({
      ...base,
      exerciseId: bench,
      sessions: [s('a', 40, [10, 10, 10]), s('b', 40, [10, 10, 10])],
    });
    // 40 × 2.5% = 1 = the 1 kg minimum → 41 → 42.5 on a 2.5 kg step
    expect(t.load).toBe(42.5);
  });

  it('per-hand dumbbells round to the dumbbell step', () => {
    const t = nextTarget({
      ...base,
      exerciseId: dbPress,
      step: 2,
      sessions: [s('a', 16, [10, 10, 10]), s('b', 16, [10, 10, 10])],
    });
    expect(t.load).toBe(18);
  });

  it('a Hard set blocks the increase and holds the reps', () => {
    const t = nextTarget({
      ...base,
      exerciseId: squat,
      sessions: [
        s('a', 60, [10, 10, 10]),
        {
          date: 'b',
          sets: [
            { load: 60, reps: 10, effort: 'ok' },
            { load: 60, reps: 8, effort: 'hard' },
          ],
        },
      ],
    });
    expect(t).toMatchObject({ load: 60, reps: 8, change: 'hold' });
  });

  it('only sessions at the current load count', () => {
    const t = nextTarget({
      ...base,
      exerciseId: squat,
      sessions: [s('a', 57.5, [10, 10, 10]), s('b', 60, [10, 10, 10])],
    });
    expect(t.change).toBe('hold');
  });

  it('with a screening cap of 7, OK still counts (its RPE starts at 7)', () => {
    const t = nextTarget({
      ...base,
      maxRpe: 7,
      exerciseId: squat,
      sessions: [s('a', 60, [10, 10]), s('b', 60, [10, 10])],
    });
    expect(t.change).toBe('increase');
  });
});

describe('pr.two_for_two (strength)', () => {
  const r = twoForTwoRule();
  const strength = { ...base, goalId: 'tr.goal.strength', repRange: [3, 6] as const };
  it(`${r.repsOver}+ reps over the target on the last set, ${r.sessions} sessions in a row → add the novice increment`, () => {
    const t = nextTarget({
      ...strength,
      exerciseId: squat,
      sessions: [s('a', 100, [5, 5, 5]), s('b', 100, [5, 5, 5])],
    });
    // lower body, novice: +2.5 → 102.5
    expect(t).toMatchObject({ load: 102.5, reps: 3, change: 'increase', method: 'pr.two_for_two' });
  });
  it('otherwise holds', () => {
    const t = nextTarget({
      ...strength,
      exerciseId: squat,
      sessions: [s('a', 100, [5, 5, 4]), s('b', 100, [5, 5, 5])],
    });
    expect(t).toMatchObject({ load: 100, change: 'hold' });
  });
});
