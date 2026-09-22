// Chart-ready data derived from the fixtures (for stories only).
import { displayName, exercise } from '@tare/data';
import {
  addDays,
  e1rmHistory,
  sessions,
  sevenDayAverage,
  shortDate,
  TODAY,
  WEEK1_MONDAY,
  weeklySets,
  weeklySetTarget,
  weighIns,
} from './index';

const dm = (d: string) => shortDate(d).slice(4); // "15 Sep"

export const benchE1rm = e1rmHistory('Barbell_Bench_Press_-_Medium_Grip').map((p) => ({
  x: dm(p.date),
  y: p.e1rm,
}));

export const weighInRaw = weighIns.map((w) => ({ x: dm(w.date), y: w.kg }));
export const weighInAvg = weighIns.map((w) => ({
  x: dm(w.date),
  y: sevenDayAverage(w.date) ?? w.kg,
}));

export const setsWeek8 = Object.entries(weeklySets(8))
  .sort((a, b) => b[1] - a[1])
  .map(([muscle, value]) => ({ label: muscle.charAt(0).toUpperCase() + muscle.slice(1), value }));
export const setBand = weeklySetTarget;

/** 9 weeks × 7 days: 0 rest, 1–3 by session length, null for days after today. */
export const heatWeeks = Array.from({ length: 9 }, (_, w) =>
  Array.from({ length: 7 }, (_, d) => {
    const date = addDays(WEEK1_MONDAY, w * 7 + d);
    if (date > TODAY) return null;
    const s = sessions.find((x) => x.date === date);
    if (!s) return 0;
    return (s.durationMin < 40 ? 1 : s.durationMin < 55 ? 2 : 3) as 1 | 2 | 3;
  }),
);

const LIFTS = [
  'Barbell_Squat',
  'Barbell_Bench_Press_-_Medium_Grip',
  'Barbell_Deadlift',
  'Wide-Grip_Lat_Pulldown',
];
export const liftRows = LIFTS.map((id) => {
  const h = e1rmHistory(id);
  const last = sessions.filter((s) => s.exercises.some((e) => e.exerciseId === id)).at(-1);
  const top = last?.exercises
    .find((e) => e.exerciseId === id)
    ?.sets.filter((s) => s.kind === 'work')[0];
  const now = h.at(-1)?.e1rm ?? 0;
  const before = h.at(-7)?.e1rm ?? h[0]?.e1rm ?? now;
  return {
    lift: displayName(exercise(id)),
    top: top ? `${top.load} × ${top.reps}` : '—',
    e1rm: now,
    change: Math.round((now - before) * 10) / 10,
    trend: h.map((p) => p.e1rm),
  };
});
