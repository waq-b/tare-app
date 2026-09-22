import { describe, expect, it } from 'vitest';
import { clock, clockWords, conventionSuffix, loadText, num, rxText } from '../src/lib/format';

describe('format', () => {
  it('formats numbers without trailing zeros', () => {
    expect(num(70)).toBe('70');
    expect(num(72.5)).toBe('72.5');
  });
  it('follows load_convention', () => {
    expect(conventionSuffix('per_hand')).toBe('per hand');
    expect(conventionSuffix('total')).toBe('');
    expect(loadText(null, 'bodyweight')).toBe('BW');
    expect(loadText(10, 'bodyweight_plus')).toBe('BW + 10');
    expect(rxText(3, 8, 70, 'total')).toBe('3 × 8 @ 70');
    expect(rxText(3, 15, null, 'bodyweight')).toBe('3 × 15');
  });
  it('formats clocks', () => {
    expect(clock(92)).toBe('1:32');
    expect(clock(5)).toBe('0:05');
    expect(clockWords(92)).toBe('1 minute 32 seconds');
    expect(clockWords(60)).toBe('1 minute');
  });
});
