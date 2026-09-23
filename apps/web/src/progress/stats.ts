// Numbers for Progress, History and Body, worked out from the log. Pure: records in, numbers
// out. e1RM and set counting are the engine's (tr.global.e1rm, tr.global.set_counting).
import { e1rm, weeklySets } from '@tare/engine';
import type { SetRecord, WeighIn, WorkoutRecord } from '../db/index.ts';
import { addDays, mondayOf } from '../lib/dates.ts';

export interface SessionPoint {
  workoutId: string;
  date: string;
  e1rm: number;
  /** Heaviest working set that day, "62.5 × 6". */
  top: string;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ''));

/** Best estimated 1RM per finished workout for an exercise, oldest first. */
export function e1rmSeries(
  workouts: readonly WorkoutRecord[],
  sets: readonly SetRecord[],
  exerciseId: string,
): SessionPoint[] {
  const done = new Map(workouts.filter((w) => w.finishedAt !== null).map((w) => [w.id, w.date]));
  const byWorkout = new Map<string, SetRecord[]>();
  for (const s of sets) {
    if (s.deleted || s.kind !== 'work' || s.exerciseId !== exerciseId || !done.has(s.workoutId))
      continue;
    byWorkout.set(s.workoutId, [...(byWorkout.get(s.workoutId) ?? []), s]);
  }
  const out: SessionPoint[] = [];
  for (const [workoutId, xs] of byWorkout) {
    const best = Math.max(0, ...xs.map((s) => e1rm(s.load, s.reps)?.e1rm ?? 0));
    if (best <= 0) continue;
    const top = [...xs].sort((a, b) => b.load - a.load || b.reps - a.reps)[0];
    out.push({
      workoutId,
      date: done.get(workoutId) ?? '',
      e1rm: best,
      top: top ? `${fmt(top.load)} × ${top.reps}` : '',
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Working sets per muscle in the week (Mon–Sun) containing `day`, from finished workouts. */
export function setsThisWeek(
  workouts: readonly WorkoutRecord[],
  sets: readonly SetRecord[],
  day: string,
) {
  const from = mondayOf(day);
  const to = addDays(from, 6);
  const inWeek = new Set(
    workouts
      .filter((w) => w.finishedAt !== null && w.date >= from && w.date <= to)
      .map((w) => w.id),
  );
  const counts = new Map<string, number>();
  for (const s of sets) {
    if (s.deleted || s.kind !== 'work' || !inWeek.has(s.workoutId)) continue;
    counts.set(s.exerciseId, (counts.get(s.exerciseId) ?? 0) + 1);
  }
  return weeklySets([...counts].map(([exerciseId, n]) => ({ exerciseId, sets: n })));
}

/** Average of weigh-ins in the 7 days ending `day`, or null with none. One decimal. */
export function sevenDayAverage(weighIns: readonly WeighIn[], day: string): number | null {
  const from = addDays(day, -6);
  const xs = weighIns.filter((w) => !w.deleted && w.date >= from && w.date <= day);
  if (!xs.length) return null;
  return Math.round((xs.reduce((t, w) => t + w.kg, 0) / xs.length) * 10) / 10;
}

/** kg per week between the first and latest 7-day averages; null with under 2 weeks of data. */
export function weeklyRate(weighIns: readonly WeighIn[], today: string): number | null {
  const live = weighIns.filter((w) => !w.deleted).sort((a, b) => a.date.localeCompare(b.date));
  const first = live[0];
  if (!first) return null;
  const startEnd = addDays(first.date, 6);
  const days = (Date.parse(today) - Date.parse(first.date)) / 86_400_000;
  if (days < 14) return null;
  const a = sevenDayAverage(live, startEnd);
  const b = sevenDayAverage(live, today);
  if (a === null || b === null) return null;
  const weeks = (Date.parse(today) - Date.parse(startEnd)) / (7 * 86_400_000);
  return Math.round(((b - a) / weeks) * 10) / 10;
}

/** The last `weeks` weeks (Mon–Sun), oldest first: 0 rest, 1–3 by session length, null ahead. */
export function heatWeeks(
  workouts: readonly WorkoutRecord[],
  today: string,
  weeks = 9,
): (0 | 1 | 2 | 3 | null)[][] {
  const start = addDays(mondayOf(today), -(weeks - 1) * 7);
  const minutes = new Map<string, number>();
  for (const w of workouts) {
    if (w.finishedAt === null) continue;
    const m = (w.finishedAt - w.startedAt) / 60000;
    minutes.set(w.date, Math.max(minutes.get(w.date) ?? 0, m));
  }
  return Array.from({ length: weeks }, (_, wk) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, wk * 7 + d);
      if (date > today) return null;
      const m = minutes.get(date);
      if (m === undefined) return 0;
      return m < 40 ? 1 : m < 55 ? 2 : 3;
    }),
  );
}

export interface LiftRow {
  exerciseId: string;
  top: string;
  e1rm: number;
  /** e1RM change against the first session in the last 6 weeks. */
  change: number;
  trend: number[];
}

/** One row per exercise with at least one estimated 1RM, best recent first. */
export function liftRows(
  workouts: readonly WorkoutRecord[],
  sets: readonly SetRecord[],
  today: string,
): LiftRow[] {
  const ids = [
    ...new Set(sets.filter((s) => s.kind === 'work' && !s.deleted).map((s) => s.exerciseId)),
  ];
  const since = addDays(today, -42);
  return ids
    .map((id) => {
      const series = e1rmSeries(workouts, sets, id);
      const last = series.at(-1);
      if (!last) return null;
      const recent = series.filter((p) => p.date >= since);
      const first = recent[0] ?? last;
      return {
        exerciseId: id,
        top: last.top,
        e1rm: last.e1rm,
        change: Math.round((last.e1rm - first.e1rm) * 10) / 10,
        trend: series.slice(-8).map((p) => p.e1rm),
      };
    })
    .filter((r): r is LiftRow => r !== null)
    .sort((a, b) => b.e1rm - a.e1rm);
}
