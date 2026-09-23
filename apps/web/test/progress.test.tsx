import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppData, type AppData } from '../src/data/DbContext.tsx';
import { TareDb, type WeighIn } from '../src/db/index.ts';
import {
  e1rmSeries,
  heatWeeks,
  liftRows,
  setsThisWeek,
  sevenDayAverage,
  weeklyRate,
} from '../src/progress/stats.ts';
import { renderApp } from './render.tsx';

const squat = 'Barbell_Squat';
const bench = 'Barbell_Bench_Press_-_Medium_Grip';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 24, 20)); // Thursday 24 September
});
afterEach(() => vi.useRealTimers());

/** A finished workout on `date` with working sets [exerciseId, load, reps][]. */
async function logWorkout(
  data: AppData,
  date: string,
  sets: [string, number, number][],
  minutes = 50,
) {
  const w = await data.r.workouts.start({ planId: null, sessionKey: 'A', date, exercises: [] });
  for (const [exerciseId, load, reps] of sets) {
    await data.r.sets.log({ workoutId: w.id, exerciseId, kind: 'work', load, reps, effort: 'ok' });
  }
  await data.r.sets.log({
    workoutId: w.id,
    exerciseId: squat,
    kind: 'warmup',
    load: 20,
    reps: 5,
    effort: null,
  });
  await data.r.workouts.update(w.id, { startedAt: Date.parse(`${date}T18:00:00`) });
  await data.r.workouts.update(w.id, {
    finishedAt: Date.parse(`${date}T18:00:00`) + minutes * 60000,
    feel: 'good',
  });
  return w;
}

async function history() {
  const data = createAppData(new TareDb(`pg-${Math.random()}`));
  await logWorkout(data, '2026-09-15', [
    [squat, 70, 8],
    [squat, 70, 8],
    [bench, 60, 8],
  ]);
  await logWorkout(
    data,
    '2026-09-22',
    [
      [squat, 75, 8],
      [squat, 75, 7],
      [bench, 60, 9],
    ],
    35,
  );
  await logWorkout(
    data,
    '2026-09-24',
    [
      [squat, 77.5, 6],
      [bench, 62.5, 6],
    ],
    60,
  );
  return data;
}

describe('progress stats', () => {
  it('e1RM per session is the best working set (Epley), with the top set, oldest first', async () => {
    const data = await history();
    const s = e1rmSeries(await data.r.workouts.finished(), await data.r.sets.all(), squat);
    expect(s.map((p) => [p.date, p.e1rm, p.top])).toEqual([
      ['2026-09-15', 88.7, '70 × 8'],
      ['2026-09-22', 95, '75 × 8'],
      ['2026-09-24', 93, '77.5 × 6'],
    ]);
  });

  it('weekly sets count this week’s working sets only, fractionally', async () => {
    const data = await history();
    const w = setsThisWeek(await data.r.workouts.finished(), await data.r.sets.all(), '2026-09-24');
    // This week (Mon 21–Sun 27): squat 3 sets, bench 2 sets. Quads are squat-primary.
    expect(w.perMuscle['quadriceps']).toBe(3);
    expect(w.perMuscle['chest']).toBe(2);
  });

  it('7-day average, and a weekly rate only after two weeks', () => {
    const wi = (date: string, kg: number): WeighIn => ({
      id: date,
      updatedAt: 0,
      date,
      time: '07:00',
      kg,
      waistCm: null,
    });
    const xs = [
      wi('2026-09-01', 92),
      wi('2026-09-03', 91.6),
      wi('2026-09-10', 91.2),
      wi('2026-09-16', 90.8),
    ];
    expect(sevenDayAverage(xs, '2026-09-03')).toBe(91.8);
    expect(sevenDayAverage(xs, '2026-08-20')).toBeNull();
    expect(weeklyRate(xs, '2026-09-10')).toBeNull();
    expect(weeklyRate(xs, '2026-09-16')).toBeLessThan(0);
  });

  it('heatmap: 9 weeks of Mon–Sun, level by session length, null after today', async () => {
    const data = await history();
    const h = heatWeeks(await data.r.workouts.finished(), '2026-09-24');
    expect(h).toHaveLength(9);
    const thisWeek = h[8]!;
    expect(thisWeek[1]).toBe(1); // Tue 22: 35 min
    expect(thisWeek[3]).toBe(3); // Thu 24: 60 min
    expect(thisWeek[4]).toBeNull();
    expect(h[7]![1]).toBe(2); // Tue 15: 50 min
  });

  it('lift rows: latest e1RM and its change over 6 weeks', async () => {
    const data = await history();
    const rows = liftRows(await data.r.workouts.finished(), await data.r.sets.all(), '2026-09-24');
    const sq = rows.find((r) => r.exerciseId === squat);
    expect(sq).toMatchObject({ top: '77.5 × 6', e1rm: 93, change: 4.3 });
    expect(sq?.trend).toEqual([88.7, 95, 93]);
  });
});

describe('Progress screens', () => {
  it('with nothing logged: nothing to chart yet', async () => {
    await renderApp('/progress');
    expect(await screen.findByText('Nothing to chart yet')).toBeTruthy();
  });

  it('Lifts: the chart’s table matches the log', async () => {
    const data = await history();
    await renderApp('/progress', { data });
    fireEvent.click(await screen.findByRole('button', { name: 'Back squat' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Table' }));
    const table = await screen.findByRole('table', { name: /Back squat estimated 1RM/ });
    const cells = within(table)
      .getAllByRole('cell')
      .map((c) => c.textContent);
    expect(cells).toEqual(['88.7', '95', '93']);
  });

  it('Lifts: sets this week against the goal’s band', async () => {
    const data = await history();
    await renderApp('/progress', { data });
    expect(await screen.findByText(/Target 4–12 \(fat loss, beginner\)/)).toBeTruthy();
    expect(screen.getByText('Quadriceps')).toBeTruthy();
  });

  it('history and a session’s detail', async () => {
    const data = await history();
    const { router } = await renderApp('/history', { data });
    const rows = await screen.findAllByRole('link', { name: /Session A/ });
    expect(rows).toHaveLength(3);
    fireEvent.click(rows[0]!);
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/history\/.+/));
    expect(await screen.findByRole('heading', { name: 'Back squat' })).toBeTruthy();
    expect(screen.getByText('Thu 24 Sep · 60 min · felt good')).toBeTruthy();
  });

  it('Body: log a weigh-in; the 7-day average and trend follow', async () => {
    const data = createAppData(new TareDb(`body-${Math.random()}`));
    await data.r.weighIns.add({ date: '2026-09-20', time: '07:00', kg: 92, waistCm: null });
    await renderApp('/progress?view=body', { data });
    expect(await screen.findByText(/Not enough data yet: the trend/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Log' }));
    const sheet = await screen.findByRole('dialog', { name: 'Log weigh-in' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Decrease Bodyweight' }));
    fireEvent.change(within(sheet).getByLabelText('Waist · optional'), {
      target: { value: '98,5' },
    });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Save' }));
    await waitFor(async () => expect(await data.r.weighIns.list()).toHaveLength(2));
    expect((await data.r.weighIns.list())[1]).toMatchObject({
      date: '2026-09-24',
      kg: 91.9,
      waistCm: 98.5,
    });
    // (92 + 91.9) / 2 = 91.95, shown to 1 dp as the 7-day average
    await waitFor(() => expect(document.body.textContent).toMatch(/Bodyweight92 kg7-day average/));
    expect(screen.queryByText(/Not enough data yet: the trend/)).toBeNull();
  });

  it('Body: an active pain flag shows its rule’s message verbatim', async () => {
    const data = createAppData(new TareDb(`body-${Math.random()}`));
    await data.r.painFlags.raise({
      date: '2026-09-20',
      area: 'shoulder',
      side: 'right',
      ruleId: 'pain_during_exercise',
      workoutId: null,
      exerciseId: null,
      skippedExerciseIds: [],
    });
    await renderApp('/progress?view=body', { data });
    expect(await screen.findByText('Right shoulder')).toBeTruthy();
  });
});
