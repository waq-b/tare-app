import { rule } from '@tare/data';
import { describe, expect, it } from 'vitest';
import { e1rm, needsWarmUp, swapStartLoad, warmUpSets } from '../src/index.ts';

const squat = 'Barbell_Squat';
const bench = 'Barbell_Bench_Press_-_Medium_Grip';
const none = new Set<string>();

describe('e1rm (tr.global.e1rm)', () => {
  it('uses Epley within the rep cap, and returns the load for a single', () => {
    expect(e1rm(100, 5)).toEqual({ e1rm: 116.7, ruleIds: ['tr.global.e1rm'] });
    expect(e1rm(100, 1)?.e1rm).toBe(100);
    const max = (rule('tr.global.e1rm').raw['value'] as { max_reps: number }).max_reps;
    expect(e1rm(100, max)).not.toBeNull();
    expect(e1rm(100, max + 1)).toBeNull();
    expect(e1rm(100, 0)).toBeNull();
    expect(e1rm(0, 5)).toBeNull();
  });
});

describe('warm-ups (tr.global.warm_up)', () => {
  it('ramps 50/75/90% for low reps, rounded down to the step', () => {
    const w = warmUpSets({
      exerciseId: squat,
      workingLoad: 100,
      workingReps: 5,
      patternsSoFar: none,
    });
    expect(w.sets).toEqual([
      { load: 50, reps: 5 },
      { load: 75, reps: 3 },
      { load: 90, reps: 1 },
    ]);
    expect(w.ruleIds).toEqual(['tr.global.warm_up']);
  });

  it('drops the 90% single above 6 reps', () => {
    const w = warmUpSets({
      exerciseId: bench,
      workingLoad: 60,
      workingReps: 8,
      patternsSoFar: none,
    });
    expect(w.sets).toEqual([
      { load: 30, reps: 5 },
      { load: 45, reps: 3 },
    ]);
  });

  it('skips a step that rounds to the same load, and zero loads', () => {
    const w = warmUpSets({
      exerciseId: bench,
      workingLoad: 5,
      workingReps: 5,
      patternsSoFar: none,
      step: 2.5,
    });
    expect(w.sets).toEqual([{ load: 2.5, reps: 5 }]);
  });

  it('only for the first compound of a pattern with external load', () => {
    expect(needsWarmUp(squat, none)).toBe(true);
    expect(needsWarmUp(squat, new Set(['squat']))).toBe(false);
    expect(needsWarmUp('Triceps_Pushdown', none)).toBe(false);
    expect(
      warmUpSets({
        exerciseId: squat,
        workingLoad: 100,
        workingReps: 5,
        patternsSoFar: new Set(['squat']),
      }),
    ).toEqual({ sets: [], ruleIds: [] });
  });
});

describe('swapStartLoad (tr.global.swap_starting_load)', () => {
  const ruleIds = ['tr.global.swap_starting_load'];

  it('barbell bench → dumbbell press: ratio per hand × margin, rounded down', () => {
    // 80 × 0.41 × 0.9 = 29.52 → 28 kg per hand at a 2 kg step
    expect(swapStartLoad({ fromId: bench, toId: 'Dumbbell_Bench_Press', workingLoad: 80 })).toEqual(
      {
        kind: 'load',
        load: 28,
        perHand: true,
        ruleIds,
      },
    );
  });

  it('bench → Smith bench uses the push_h ratio', () => {
    // 80 × 0.9 × 0.9 = 64.8 → 62.5
    expect(
      swapStartLoad({ fromId: bench, toId: 'Smith_Machine_Bench_Press', workingLoad: 80 }),
    ).toMatchObject({
      kind: 'load',
      load: 62.5,
    });
  });

  it('calibrates where there is no reliable ratio (machine, cable, other pattern)', () => {
    expect(swapStartLoad({ fromId: squat, toId: 'Leg_Press', workingLoad: 100 }).kind).toBe(
      'calibrate',
    );
    expect(swapStartLoad({ fromId: bench, toId: squat, workingLoad: 80 }).kind).toBe('calibrate');
  });

  it('bodyweight swaps have no load', () => {
    expect(swapStartLoad({ fromId: bench, toId: 'Pushups', workingLoad: 80 }).kind).toBe(
      'bodyweight',
    );
  });
});
