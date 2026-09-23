import { progressionText } from '@tare/data';
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppData, type AppData } from '../src/data/DbContext.tsx';
import { TareDb } from '../src/db/index.ts';
import { addDays } from '../src/lib/dates.ts';
import { seedPlan } from '../src/seed/plan.ts';
import { DEFAULT_DRAFT } from '../src/screens/onboarding/draft.ts';
import { renderApp, testProfile } from './render.tsx';

const FIRST = '2026-09-01';
afterEach(() => vi.useRealTimers());

async function withLogs(weeks: number): Promise<AppData> {
  const data = createAppData(new TareDb(`coach-${Math.random()}`));
  await data.r.profile.save({ ...testProfile, onboardedAt: 1 });
  const { plan } = seedPlan({
    goalId: 'tr.goal.fat_loss',
    daysPerWeek: 3,
    kit: DEFAULT_DRAFT.kit,
    cantDo: DEFAULT_DRAFT.cantDo,
    startedOn: FIRST,
  });
  await data.r.plans.activate(plan);
  const w = await data.r.workouts.start({
    planId: null,
    sessionKey: 'A',
    date: FIRST,
    exercises: [],
  });
  await data.r.sets.log({
    workoutId: w.id,
    exerciseId: 'Barbell_Squat',
    kind: 'work',
    load: 60,
    reps: 8,
    effort: 'ok',
  });
  await data.r.workouts.finish(w.id, 'good');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${addDays(FIRST, weeks * 7)}T18:00:00`));
  return data;
}

describe('Coach tab', () => {
  const need = progressionText().aiAfterWeeks;
  it(`before ${need} weeks of logs: not enough data yet, with the ramp rule verbatim`, async () => {
    await renderApp('/coach', { data: await withLogs(2) });
    expect(await screen.findByText('Not enough data yet.')).toBeTruthy();
    expect(
      screen.getByRole('progressbar', { name: /Week 3 of 4 before your first review/ }),
    ).toBeTruthy();
    expect(screen.getByText('Rules running now')).toBeTruthy();
  });

  it('with no plan or logs yet: still honest', async () => {
    await renderApp('/coach');
    expect(await screen.findByText('Not enough data yet.')).toBeTruthy();
  });

  it(`after ${need} weeks: a rules-only summary`, async () => {
    await renderApp('/coach', { data: await withLogs(need) });
    expect(await screen.findByText('The last 4 weeks')).toBeTruthy();
    expect(screen.getByText('Next planned deload')).toBeTruthy();
    expect(screen.getByText('Rules only, until your Claude connects')).toBeTruthy();
  });
});
