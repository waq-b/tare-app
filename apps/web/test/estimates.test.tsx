import { startingLoadRule } from '@tare/data';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppData, type AppData } from '../src/data/DbContext.tsx';
import { TareDb } from '../src/db/index.ts';
import { seedPlan } from '../src/seed/plan.ts';
import { DEFAULT_DRAFT } from '../src/screens/onboarding/draft.ts';
import { renderApp, testProfile } from './render.tsx';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 22, 18)); // Tuesday: session A
});
afterEach(() => vi.useRealTimers());

/** The rule's first worked example: a 35-year-old beginner man, 92 kg, 180 cm. */
async function withStats(): Promise<AppData> {
  const data = createAppData(new TareDb(`est-${Math.random()}`));
  await data.r.profile.save({
    ...testProfile,
    kit: DEFAULT_DRAFT.kit,
    onboardedAt: 1,
    sex: 'male',
    birthYear: 2026 - 35,
    heightCm: 180,
  });
  await data.r.weighIns.add({ date: '2026-09-20', time: '07:00', kg: 92, waistCm: null });
  const { plan } = seedPlan({
    goalId: 'tr.goal.fat_loss',
    daysPerWeek: 3,
    kit: DEFAULT_DRAFT.kit,
    cantDo: DEFAULT_DRAFT.cantDo,
    startedOn: '2026-09-21',
  });
  await data.r.plans.activate(plan);
  return data;
}

describe('suggested starting weights (tr.global.starting_load)', () => {
  it('Today suggests weights from body stats, labelled as estimates; others stay an easy set', async () => {
    await renderApp('/', { data: await withStats() });
    const squat = await screen.findByRole('link', { name: /Back squat/ });
    expect(squat.textContent).toContain('@ 40');
    expect(squat.textContent).toContain('Estimated from your body stats');
    const pulldown = screen.getByRole('link', { name: /Lat pulldown/ });
    expect(pulldown.textContent).toContain('@ 20');
    expect(pulldown.textContent).toContain('a rough guide');
    const legPress = screen.getByRole('link', { name: /Leg press/ });
    expect(legPress.textContent).toContain('Easy first set');
  });

  it('a logged weight always beats the estimate', async () => {
    const data = await withStats();
    const w = await data.r.workouts.start({
      planId: null,
      sessionKey: 'A',
      date: '2026-09-15',
      exercises: [],
    });
    await data.r.sets.log({
      workoutId: w.id,
      exerciseId: 'Barbell_Squat',
      kind: 'work',
      load: 70,
      reps: 8,
      effort: 'ok',
    });
    await data.r.workouts.finish(w.id, 'good');
    await renderApp('/', { data });
    const squat = await screen.findByRole('link', { name: /Back squat/ });
    expect(squat.textContent).toContain('@ 70');
    expect(squat.textContent).not.toContain('Estimated');
  });

  it('first session: the rule’s label shows, and an Easy set raises the next one', async () => {
    const data = await withStats();
    const { router } = await renderApp('/', { data });
    fireEvent.click(await screen.findByRole('button', { name: 'Start workout' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/workout'));
    expect(
      await screen.findByText(new RegExp(startingLoadRule().first_session.label.slice(0, 30))),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Done/ }).textContent).toContain('40 × 6');
    fireEvent.click(screen.getByRole('button', { name: /^Done/ }));
    const rest = await screen.findByRole('dialog', { name: 'Rest' });
    fireEvent.click(within(rest).getByRole('radio', { name: 'Easy' }));
    // Easy → up 5–10% in kit steps: 40 → 42.5 (one 2.5 kg step)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Done/ }).textContent).toContain('42.5 × 6'),
    );
  });

  it('Settings → About you saves the stats and a new weight as a weigh-in', async () => {
    const data = await withStats();
    await renderApp('/settings/about-you', { data });
    const kg = await screen.findByLabelText('Weight · kg');
    expect((kg as HTMLInputElement).value).toBe('92');
    expect((screen.getByLabelText('Age') as HTMLInputElement).value).toBe('35');
    fireEvent.change(kg, { target: { value: '91,5' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Rather not say' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Saved')).toBeTruthy();
    expect((await data.r.profile.get())?.sex).toBe('prefer_not_to_say');
    expect((await data.r.weighIns.list()).at(-1)?.kg).toBe(91.5);
  });
});
