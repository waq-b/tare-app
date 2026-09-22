import { describe, expect, it } from 'vitest';
import { extent, linear, niceTicks, zeroBased } from '../src/lib/scale';

describe('scale', () => {
  it('maps linearly', () => {
    const s = linear([0, 100], [0, 200]);
    expect(s(50)).toBe(100);
    expect(linear([10, 20], [100, 0])(15)).toBe(50);
  });

  it('makes nice ticks that cover the data', () => {
    const t = niceTicks(72, 80.4);
    expect(t[0]).toBeLessThanOrEqual(72);
    expect(t.at(-1)).toBeGreaterThanOrEqual(80.4);
    expect(t).toEqual([70, 72.5, 75, 77.5, 80, 82.5]);
    expect(niceTicks(0, 2300)).toEqual([0, 1000, 2000, 3000]);
  });

  it('ignores nulls in extents', () => {
    expect(extent([3, null, 7, undefined, 1])).toEqual([1, 7]);
    expect(extent([])).toEqual([0, 1]);
  });

  it('bars always start at zero', () => {
    const [lo, hi] = zeroBased([2090, 2310, null, 2150], [2300]);
    expect(lo).toBe(0);
    expect(hi).toBeGreaterThanOrEqual(2310);
  });
});
