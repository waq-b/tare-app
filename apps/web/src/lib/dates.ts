// Calendar days as ISO strings (YYYY-MM-DD) in the phone's local time. Weeks start on Monday
// (weekday 0), as in the plan.
const pad = (n: number) => String(n).padStart(2, '0');

export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, n: number): string {
  const d = parseDay(iso);
  d.setDate(d.getDate() + n);
  return isoDay(d);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayOf(iso: string): number {
  return (parseDay(iso).getDay() + 6) % 7;
}

export function mondayOf(iso: string): string {
  return addDays(iso, -weekdayOf(iso));
}

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "Tuesday 22 September" */
export function longDate(iso: string): string {
  const d = parseDay(iso);
  return `${WEEKDAYS[weekdayOf(iso)]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Tue 22 Sep" */
export function shortDate(iso: string): string {
  const d = parseDay(iso);
  return `${WEEKDAYS_SHORT[weekdayOf(iso)]} ${d.getDate()} ${MONTHS[d.getMonth()]?.slice(0, 3)}`;
}
