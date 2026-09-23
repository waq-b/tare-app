import { safetyRules } from '@tare/data';
import { describe, expect, it } from 'vitest';
import { noHardSets, returnAfterFlag } from '../src/index.ts';

describe('safety engine actions', () => {
  it('pain_during_exercise: back at half the previous load, rounded down to the kit', () => {
    expect(
      returnAfterFlag({ ruleId: 'pain_during_exercise', lastLoad: 65, sets: 3, step: 2.5 }),
    ).toEqual({
      // 65 × 50% = 32.5, already a whole 2.5 kg step
      load: 32.5,
      sets: 3,
      ruleIds: ['pain_during_exercise'],
    });
  });

  it('rounds down to the kit, never up', () => {
    expect(
      returnAfterFlag({ ruleId: 'pain_during_exercise', lastLoad: 67.5, sets: 3, step: 2.5 }).load,
    ).toBe(32.5);
  });

  it('suspected_sprain_strain: back at half the sets', () => {
    expect(
      returnAfterFlag({ ruleId: 'suspected_sprain_strain', lastLoad: 60, sets: 4, step: 2.5 }),
    ).toMatchObject({ load: 60, sets: 2 });
  });

  it('doms_normal: no Hard sets while active', () => {
    expect(noHardSets(['doms_normal'])).toBe(true);
    expect(noHardSets([])).toBe(false);
  });

  it('property: for every safety rule, a return never adds load or sets', () => {
    for (const r of safetyRules()) {
      for (const [load, sets] of [
        [100, 4],
        [20, 1],
        [2.5, 2],
      ] as const) {
        const out = returnAfterFlag({ ruleId: r.id, lastLoad: load, sets, step: 2.5 });
        expect(out.load ?? 0, r.id).toBeLessThanOrEqual(load);
        expect(out.sets, r.id).toBeLessThanOrEqual(sets);
      }
    }
  });
});
