import { startingLoadRule } from '@tare/data';
import { describe, expect, it } from 'vitest';
import { firstSessionNext, kitKindOf, suggestStartingLoad, type BodyStats } from '../src/index.ts';

const rule = startingLoadRule();
const KIT = rule.worked_examples[0]
  ? (
      rule as unknown as {
        worked_examples_kit: Record<string, { step_kg: number; lightest_kg: number }>;
      }
    ).worked_examples_kit
  : {};

describe('tr.global.starting_load: the rule’s worked examples (4 people, 24 results)', () => {
  for (const ex of rule.worked_examples) {
    const stats: BodyStats = {
      sex: ex.input.sex as BodyStats['sex'],
      age: ex.input.age,
      bodyweight: ex.input.bodyweight,
      heightCm: ex.input.height_cm,
      level: ex.input.level as BodyStats['level'],
    };
    for (const [exerciseId, want] of Object.entries(ex.expected)) {
      it(`${ex.input.name}: ${exerciseId}`, () => {
        const got = suggestStartingLoad({
          exerciseId,
          stats,
          targetReps: ex.input.target_reps,
          kit: { step: want.kit_step_kg, lightest: want.lightest_kg },
        });
        expect(got.outcome).toBe(want.outcome);
        expect(got.unrounded).toBe(want.unrounded_kg);
        expect(got.load).toBe(want.suggested_kg);
        expect(got.ruleIds).toEqual(['tr.global.starting_load']);
      });
    }
  }

  it('the examples’ kit matches how each exercise is rounded', () => {
    expect(Object.keys(KIT).sort()).toEqual(['barbell', 'dumbbell', 'stack']);
    expect(kitKindOf('Barbell_Squat')).toBe('barbell');
    expect(kitKindOf('Dumbbell_Bench_Press')).toBe('dumbbell');
    expect(kitKindOf('Wide-Grip_Lat_Pulldown')).toBe('stack');
  });
});

const man: BodyStats = { sex: 'male', age: 35, bodyweight: 92, heightCm: 180, level: 'beginner' };
const barbell = { step: 2.5, lightest: 20 };

describe('suggestStartingLoad', () => {
  it('calibrates what the rule lists, with its reason', () => {
    const [id, why] = Object.entries(rule.calibrate_instead.staples)[0]!;
    expect(
      suggestStartingLoad({ exerciseId: id, stats: man, targetReps: 10, kit: barbell }),
    ).toMatchObject({ outcome: 'calibrate', load: null, reason: why });
  });

  it('calibrates outside the rule’s age range, or without a bodyweight', () => {
    const [lo, hi] = rule.inputs.age.applies;
    for (const age of [lo - 1, hi + 1]) {
      expect(
        suggestStartingLoad({
          exerciseId: 'Barbell_Squat',
          stats: { ...man, age },
          targetReps: 10,
          kit: barbell,
        }).outcome,
      ).toBe('calibrate');
    }
    expect(
      suggestStartingLoad({
        exerciseId: 'Barbell_Squat',
        stats: { ...man, bodyweight: 0 },
        targetReps: 10,
        kit: barbell,
      }).outcome,
    ).toBe('calibrate');
  });

  it('pulldowns and cable rows are marked stack-dependent', () => {
    const got = suggestStartingLoad({
      exerciseId: 'Wide-Grip_Lat_Pulldown',
      stats: man,
      targetReps: 10,
      kit: { step: 5, lightest: 5 },
    });
    expect(got).toMatchObject({ outcome: 'estimate', stackDependent: true });
  });

  it('prefer not to say uses the female ratios (the lower)', () => {
    const f = suggestStartingLoad({
      exerciseId: 'Barbell_Squat',
      stats: { ...man, sex: 'female' },
      targetReps: 10,
      kit: barbell,
    });
    const p = suggestStartingLoad({
      exerciseId: 'Barbell_Squat',
      stats: { ...man, sex: 'prefer_not_to_say' },
      targetReps: 10,
      kit: barbell,
    });
    expect(p.unrounded).toBe(f.unrounded);
  });

  it('never rounds up', () => {
    for (let bw = 50; bw <= 130; bw += 7) {
      const got = suggestStartingLoad({
        exerciseId: 'Barbell_Squat',
        stats: { ...man, bodyweight: bw },
        targetReps: 8,
        kit: barbell,
      });
      if (got.outcome === 'estimate') expect(got.load).toBeLessThanOrEqual(got.unrounded!);
    }
  });
});

describe('first session after set 1 (the rule’s first_session)', () => {
  const [lo, hi] = rule.afterEasyRaise;
  it('Easy: up by the rule’s range in whole kit steps', () => {
    const n = firstSessionNext({ load: 60, effort: 'easy', kit: barbell });
    expect(n.load - 60).toBeGreaterThanOrEqual(60 * lo);
    expect(n.load - 60).toBeLessThanOrEqual(60 * hi);
    expect((n.load - 60) % 2.5).toBe(0);
  });
  it('Easy on a light weight: one kit step even if that’s more than the range', () => {
    expect(firstSessionNext({ load: 20, effort: 'easy', kit: barbell }).load).toBe(22.5);
  });
  it('OK keeps; Hard drops by the rule’s share, never below the lightest option', () => {
    expect(firstSessionNext({ load: 40, effort: 'ok', kit: barbell })).toMatchObject({
      load: 40,
      changed: false,
    });
    expect(firstSessionNext({ load: 50, effort: 'hard', kit: barbell }).load).toBe(
      Math.floor((50 * (1 - rule.afterHardDrop)) / 2.5) * 2.5,
    );
    expect(firstSessionNext({ load: 20, effort: 'hard', kit: barbell }).load).toBe(20);
  });
});
