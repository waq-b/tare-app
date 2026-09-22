// Weigh-ins at any frequency (decision 10), with a 7-day average for charts.
import { addDays, TODAY, WEEK1_MONDAY } from './calendar';
import type { ISODate, WeighIn } from './types';

/** Deterministic pattern of weigh-in days: 2–4 a week, never on a fixed schedule. */
const OFFSETS = [
  0, 2, 5, 7, 8, 11, 14, 16, 19, 21, 23, 26, 28, 29, 33, 35, 37, 40, 42, 44, 47, 49, 51, 54, 56,
];
const NOISE = [
  0.3, -0.2, 0.4, -0.4, 0.1, 0.5, -0.3, 0.2, -0.5, 0.3, 0, -0.2, 0.4, -0.1, 0.2, -0.4, 0.5, -0.3,
  0.1, -0.2, 0.3, -0.1, 0.2, -0.3, 0.1,
];

export const weighIns: readonly WeighIn[] = OFFSETS.map((d, i) => ({
  date: addDays(WEEK1_MONDAY, d),
  time: '07:1' + (i % 10),
  kg: Math.round((91.8 - d * 0.055 + (NOISE[i] ?? 0)) * 10) / 10,
  ...(i % 7 === 0 ? { waistCm: Math.round((98 - d * 0.05) * 10) / 10 } : {}),
}));

/** Mean of weigh-ins in the 7 days ending on `date`, or null if there are none. */
export function sevenDayAverage(date: ISODate = TODAY): number | null {
  const from = addDays(date, -6);
  const inWindow = weighIns.filter((w) => w.date >= from && w.date <= date);
  if (!inWindow.length) return null;
  return Math.round((inWindow.reduce((s, w) => s + w.kg, 0) / inWindow.length) * 10) / 10;
}
