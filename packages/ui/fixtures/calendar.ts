// The fixture calendar. "Today" is Tue 22 Sep 2026, week 9 of training.
import type { ISODate } from './types';

export const TODAY: ISODate = '2026-09-22';
/** Monday of week 1. Weeks 1–8 are logged; week 9 is the current week. */
export const WEEK1_MONDAY: ISODate = '2026-07-27';
export const CURRENT_WEEK = 9;
/** Planned deload (pr.deload default: every 5 weeks, so week 6). */
export const DELOAD_WEEK = 6;

const DAY = 86_400_000;
const toDate = (d: ISODate) => new Date(`${d}T00:00:00Z`);
export const iso = (d: Date): ISODate => d.toISOString().slice(0, 10);

export function addDays(d: ISODate, n: number): ISODate {
  return iso(new Date(toDate(d).getTime() + n * DAY));
}

/** Date of a weekday (0 = Monday) in a training week (1-based). */
export function dateOf(week: number, weekday: number): ISODate {
  return addDays(WEEK1_MONDAY, (week - 1) * 7 + weekday);
}

export function weekOf(d: ISODate): number {
  return Math.floor((toDate(d).getTime() - toDate(WEEK1_MONDAY).getTime()) / (7 * DAY)) + 1;
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayOf(d: ISODate): number {
  return (toDate(d).getUTCDay() + 6) % 7;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Tue 22 Sep" (UK style). */
export function shortDate(d: ISODate): string {
  const x = toDate(d);
  return `${DAYS[weekdayOf(d)]} ${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`;
}
