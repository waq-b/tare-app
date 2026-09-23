import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppData, type AppData } from '../src/data/DbContext.tsx';
import { TareDb } from '../src/db/index.ts';
import { seedPlan } from '../src/seed/plan.ts';
import { DEFAULT_DRAFT } from '../src/screens/onboarding/draft.ts';
import { renderApp } from './render.tsx';

// Tuesday 22 September 2026: session A (Tue/Thu/Sat plan).
const TUESDAY = new Date(2026, 8, 22, 9);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TUESDAY);
});
afterEach(() => vi.useRealTimers());

async function withPlan(startLoads: Record<string, number> = {}): Promise<AppData> {
  const data = createAppData(new TareDb(`t6-${Math.random()}`));
  const { plan } = seedPlan({
    goalId: 'tr.goal.fat_loss',
    daysPerWeek: 3,
    kit: DEFAULT_DRAFT.kit,
    cantDo: DEFAULT_DRAFT.cantDo,
    startedOn: '2026-09-21',
  });
  await data.r.plans.activate({
    ...plan,
    sessions: plan.sessions.map((s) => ({
      ...s,
      exercises: s.exercises.map((e) => ({ ...e, startLoad: startLoads[e.exerciseId] ?? null })),
    })),
  });
  return data;
}

async function logSquat(data: AppData, date: string, load: number) {
  const w = await data.r.workouts.start({ planId: null, sessionKey: 'A', date, exercises: [] });
  for (let i = 0; i < 3; i++) {
    await data.r.sets.log({
      workoutId: w.id,
      exerciseId: 'Barbell_Squat',
      kind: 'work',
      load,
      reps: 8,
      effort: 'ok',
    });
  }
  await data.r.workouts.finish(w.id, 'good');
  return w;
}

describe('Today', () => {
  it('shows today’s session with loads to aim for, and a blank start as an easy first set', async () => {
    const data = await withPlan({ Barbell_Squat: 70 });
    await renderApp('/', { data });
    expect(await screen.findByText('Session A · Squat + pull')).toBeTruthy();
    expect(screen.getByText('Tuesday 22 September')).toBeTruthy();
    const squat = screen.getByRole('link', { name: /Back squat/ });
    expect(squat.textContent).toContain('3 × 6–10 @ 70');
    expect(squat.textContent).toContain('Warm-up sets included');
    const pulldown = screen.getByRole('link', { name: /Lat pulldown/ });
    expect(pulldown.textContent).toContain('Easy first set to find your weight');
    expect(pulldown.textContent).not.toContain('@');
  });

  it('prefills the last working load, and updates live after a session (#70)', async () => {
    const data = await withPlan({ Barbell_Squat: 70 });
    await renderApp('/', { data });
    const squat = await screen.findByRole('link', { name: /Back squat/ });
    expect(squat.textContent).toContain('@ 70');
    await logSquat(data, '2026-09-19', 75);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Back squat/ }).textContent).toContain('@ 75'),
    );
  });

  it('the week strip marks planned, done and today', async () => {
    const data = await withPlan();
    await logSquat(data, '2026-09-21', 70); // Monday, unplanned but done
    await renderApp('/', { data });
    const strip = await screen.findByRole('list', { name: /week/i });
    const days = within(strip).getAllByRole('listitem');
    expect(days).toHaveLength(7);
    expect(days[0]?.textContent).toMatch(/done/);
    expect(days[1]?.textContent).toMatch(/today: session planned/);
    expect(days[3]?.textContent).toMatch(/planned/);
    expect(days[2]?.textContent).toMatch(/rest/);
  });

  it('Start workout makes a workout for today and opens it; Today then offers Resume', async () => {
    const data = await withPlan();
    const { router } = await renderApp('/', { data });
    fireEvent.click(await screen.findByRole('button', { name: 'Start workout' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/workout'));
    const w = await data.r.workouts.unfinished();
    expect(w).toMatchObject({ date: '2026-09-22', sessionKey: 'A' });
    expect(w?.exercises.map((e) => e.exerciseId)[0]).toBe('Barbell_Squat');
    await router.navigate('/');
    expect(await screen.findByText('Workout in progress')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start workout' })).toBeNull();
  });

  it('after today’s workout: done for today', async () => {
    const data = await withPlan();
    await logSquat(data, '2026-09-22', 70);
    await renderApp('/', { data });
    expect(await screen.findByText('Done for today.')).toBeTruthy();
  });

  it('a rest day shows the next session', async () => {
    vi.setSystemTime(new Date(2026, 8, 23, 9)); // Wednesday
    const data = await withPlan();
    await renderApp('/', { data });
    expect(await screen.findByText('Rest day.')).toBeTruthy();
    expect(screen.getByText('Next session · Thursday')).toBeTruthy();
    expect(screen.getByText('Session B · Push + pull')).toBeTruthy();
  });
});

describe('Plan', () => {
  it('lists the week and opens a session', async () => {
    const data = await withPlan();
    const { router } = await renderApp('/plan', { data });
    const b = await screen.findByRole('link', { name: /Push \+ pull/ });
    expect(screen.getAllByText('Rest')).toHaveLength(4);
    fireEvent.click(b);
    await waitFor(() => expect(router.state.location.pathname).toBe('/plan/B'));
    expect(await screen.findByText('Session B · Push + pull')).toBeTruthy();
    expect(await screen.findByRole('link', { name: /Bench press/ })).toBeTruthy();
  });
});

describe('Exercise detail', () => {
  it('says “not enough data yet” before two sessions, then charts the e1RM', async () => {
    const data = await withPlan();
    await logSquat(data, '2026-09-15', 70);
    await renderApp('/exercise/Barbell_Squat', { data });
    expect(await screen.findByText('Not enough data yet')).toBeTruthy();
    await logSquat(data, '2026-09-19', 75);
    // 75 × 8 → Epley 95 (tr.global.e1rm)
    await waitFor(() => expect(screen.queryByText('Not enough data yet')).toBeNull());
    const main = document.querySelector('main')?.textContent ?? '';
    expect(main).toContain('Estimated 1RM · estimated95 kg');
    // Newest first, dated by the workout (not when the sets were typed in)
    expect(main).toMatch(/Sat 19 Sep75 × 8 · 8 · 8Tue 15 Sep70 × 8 · 8 · 8/);
    expect(screen.getAllByRole('link', { name: /75 × 8 · 8 · 8/ }).length).toBe(1);
  });

  it('shows cues, the why from the goal, and swaps for the kit with start loads', async () => {
    const data = await withPlan();
    await logSquat(data, '2026-09-19', 80);
    await renderApp('/exercise/Barbell_Bench_Press_-_Medium_Grip', { data });
    expect(await screen.findByText('Cues')).toBeTruthy();
    expect(await screen.findByText(/from your goal’s ranges/)).toBeTruthy();
    expect(screen.getByText('Swaps for your kit')).toBeTruthy();
  });

  it('an unknown exercise goes back to the plan', async () => {
    const { router } = await renderApp('/exercise/Nope');
    await waitFor(() => expect(router.state.location.pathname).toBe('/plan'));
  });
});
