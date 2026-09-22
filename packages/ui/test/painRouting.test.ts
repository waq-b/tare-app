import { safetyRule } from '@tare/data';
import { describe, expect, it } from 'vitest';
import { routePainFlag, SIGNS, TIMINGS, type PainAnswers } from '../stories/screens/painRouting';

const base: PainAnswers = { area: 'shoulder', timing: 'during', signs: [], unsure: false };

describe('pain-flag routing (story helper)', () => {
  it('only ever returns real safety rules', () => {
    for (const r of [
      ...SIGNS.map((s) => s.rule),
      ...TIMINGS.map((t) => t.rule),
      'unsure_if_emergency',
    ]) {
      expect(() => safetyRule(r), r).not.toThrow();
    }
  });

  it('sharp shoulder pain during bench → pain_during_exercise → modify', () => {
    const id = routePainFlag(base);
    expect(id).toBe('pain_during_exercise');
    expect(safetyRule(id!).action).toBe('modify_exercise');
  });

  it('routes each timing to its rule', () => {
    expect(routePainFlag({ ...base, timing: 'after' })).toBe('doms_normal');
    expect(routePainFlag({ ...base, timing: 'week' })).toBe('pain_not_doms');
    expect(routePainFlag({ ...base, timing: 'six_weeks' })).toBe('pain_not_settling_6wk');
  });

  it('puts the most urgent answer first', () => {
    expect(routePainFlag({ ...base, area: 'calf', signs: ['calf_hot', 'sprain'] })).toBe(
      'calf_hot_swollen',
    );
    expect(safetyRule('calf_hot_swollen').action).toBe('stop_now_call_999');
    expect(routePainFlag({ ...base, signs: ['severe', 'cant_bear_weight'] })).toBe('injury_severe');
    expect(routePainFlag({ ...base, signs: ['cant_bear_weight'], unsure: true })).toBe(
      'injury_cant_bear_weight',
    );
    expect(routePainFlag({ ...base, signs: ['sprain'], unsure: true })).toBe('unsure_if_emergency');
    expect(routePainFlag({ ...base, signs: ['sprain'] })).toBe('suspected_sprain_strain');
  });

  it('a hot calf sign only counts for the calf', () => {
    expect(routePainFlag({ ...base, area: 'knee', signs: ['calf_hot'] })).toBe(
      'pain_during_exercise',
    );
  });

  it('waits for an area and a timing unless a red flag decides it', () => {
    expect(routePainFlag({ area: null, timing: null, signs: [], unsure: false })).toBeNull();
    expect(routePainFlag({ area: null, timing: null, signs: ['severe'], unsure: false })).toBe(
      'injury_severe',
    );
  });
});
