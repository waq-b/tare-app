// Tiny scale helpers for the hand-rolled SVG charts.

/** Maps a domain value to a range value, linearly. */
export function linear([d0, d1]: readonly [number, number], [r0, r1]: readonly [number, number]) {
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

/** "Nice" tick values covering [min, max], about `count` of them (1, 2, 2.5, 5 × 10ⁿ steps). */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const raw = (max - min) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** [min, max] of numbers, ignoring nulls. */
export function extent(values: readonly (number | null | undefined)[]): [number, number] {
  const xs = values.filter((v): v is number => typeof v === 'number');
  return xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, 1];
}

/** Bars and meters always start at zero: this is the only domain they may use. */
export function zeroBased(
  values: readonly (number | null | undefined)[],
  extra: readonly number[] = [],
): [number, number] {
  const [, max] = extent([...values, ...extra]);
  const ticks = niceTicks(0, max);
  return [0, ticks.at(-1) ?? max];
}
