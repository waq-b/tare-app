import { describe, expect, it } from 'vitest';
import { rule, startingLoadRule, vpt } from '../src/index.ts';

describe('vpt v0.1.3', () => {
  it('loads at the minimum version', () => {
    expect(vpt().version >= '0.1.3').toBe(true);
  });

  it('tr.global.starting_load validates, with its text constants parsed (FALLBACK vpt-issue #21)', () => {
    const r = startingLoadRule();
    expect(r.bmiCap).toBe(25);
    expect(r.firstSessionRir).toBe(4);
    expect(r.lightestMaxPctOf1rm).toBe(0.7);
    expect(r.worked_examples).toHaveLength(4);
    expect(r.worked_examples.flatMap((e) => Object.keys(e.expected))).toHaveLength(24);
    expect(r.anchors).toEqual(['squat', 'bench', 'deadlift', 'ohp', 'lat_pulldown', 'row']);
    expect(rule('tr.global.starting_load').evidenceStrength).toBe('weak');
  });

  it('every mapped staple and calibrate entry is a real exercise, and none is in both', () => {
    const r = startingLoadRule();
    const ids = new Set(vpt().exercises.map((e) => e.id));
    for (const id of [...Object.keys(r.staples), ...Object.keys(r.calibrate_instead.staples)]) {
      expect(ids.has(id), id).toBe(true);
    }
    for (const id of Object.keys(r.staples))
      expect(r.calibrate_instead.staples[id], id).toBeUndefined();
    for (const s of Object.values(r.staples)) expect(r.anchors).toContain(s.anchor);
  });

  it('pr.personal_adjustment is accepted (not built: #93 is later)', () => {
    const p = rule('pr.personal_adjustment');
    expect(p.file).toBe('progression');
    expect(p.sources.length).toBeGreaterThan(0);
  });
});
