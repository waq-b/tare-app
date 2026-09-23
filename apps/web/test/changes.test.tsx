import { deloadRule } from '@tare/data';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppData, type AppData } from '../src/data/DbContext.tsx';
import { TareDb } from '../src/db/index.ts';
import { addDays } from '../src/lib/dates.ts';
import { seedPlan } from '../src/seed/plan.ts';
import { DEFAULT_DRAFT } from '../src/screens/onboarding/draft.ts';
import { renderApp, testProfile } from './render.tsx';

const FIRST = '2026-09-01'; // Tuesday, week 1
afterEach(() => vi.useRealTimers());

function at(iso: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${iso}T18:00:00`));
}

async function setup(): Promise<AppData> {
  const data = createAppData(new TareDb(`chg-${Math.random()}`));
  await data.r.profile.save({ ...testProfile, kit: DEFAULT_DRAFT.kit, onboardedAt: 1 });
  const { plan } = seedPlan({
    goalId: 'tr.goal.fat_loss',
    daysPerWeek: 3,
    kit: DEFAULT_DRAFT.kit,
    cantDo: DEFAULT_DRAFT.cantDo,
    startedOn: FIRST,
  });
  await data.r.plans.activate(plan);
  return data;
}

async function log(
  data: AppData,
  date: string,
  sets: [string, number, number][],
  feel: 'good' | 'tough' = 'good',
) {
  const w = await data.r.workouts.start({ planId: null, sessionKey: 'A', date, exercises: [] });
  for (const [id, load, reps] of sets) {
    await data.r.sets.log({
      workoutId: w.id,
      exerciseId: id,
      kind: 'work',
      load,
      reps,
      effort: 'ok',
    });
  }
  await data.r.workouts.finish(w.id, feel);
}

const squat = (load: number, reps: number[]) =>
  reps.map((r) => ['Barbell_Squat', load, r] as [string, number, number]);

describe('changes the rules make (P1 T8)', () => {
  it('a load increase applies by itself, with a chip and why, and can be undone', async () => {
    const data = await setup();
    await log(data, FIRST, squat(55, [8, 8]));
    await log(data, '2026-09-15', squat(60, [10, 10]));
    await log(data, '2026-09-19', squat(60, [10, 10]));
    at('2026-09-22'); // Tuesday, week 4: session A, after the ramp
    const { router } = await renderApp('/', { data });
    const card = await screen.findByRole('link', { name: /Back squat/ });
    // 60 × 5% = 3 → 63 → 65 on 2.5 kg steps; reps back to the bottom (6)
    expect(card.textContent).toContain('3 × 6 @ 65');
    expect(card.textContent).toContain('+5');

    await router.navigate('/exercise/Barbell_Squat');
    expect(await screen.findByText(/Up to 65 kg from 60 kg/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep 60 kg for now' }));
    await waitFor(async () =>
      expect((await data.r.changes.all())[0]).toMatchObject({
        kind: 'progression',
        status: 'undone',
      }),
    );
    await router.navigate('/');
    const held = await screen.findByRole('link', { name: /Back squat/ });
    await waitFor(() => expect(held.textContent).toContain('@ 60'));
    expect(held.textContent).not.toContain('+5');
  });

  it('starting the workout logs the applied increase', async () => {
    const data = await setup();
    await log(data, FIRST, squat(55, [8, 8]));
    await log(data, '2026-09-15', squat(60, [10, 10]));
    await log(data, '2026-09-19', squat(60, [10, 10]));
    at('2026-09-22');
    const { router } = await renderApp('/', { data });
    fireEvent.click(await screen.findByRole('button', { name: 'Start workout' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/workout'));
    const applied = (await data.r.changes.all()).find((c) => c.status === 'applied');
    expect(applied).toMatchObject({
      kind: 'progression',
      exerciseId: 'Barbell_Squat',
      from: { load: 60 },
      to: { load: 65 },
    });
    expect(applied?.ruleIds).toContain('pr.double_progression');
    const w = await data.r.workouts.unfinished();
    expect(w?.exercises[0]).toMatchObject({ load: 65, reps: 6 });
  });

  it('a stall is offered, not applied; Accept resets the load', async () => {
    const data = await setup();
    await log(data, FIRST, squat(55, [8, 8]));
    for (const d of ['2026-09-08', '2026-09-11', '2026-09-15', '2026-09-19'])
      await log(data, d, squat(60, [8, 8, 8]));
    at('2026-09-22');
    await renderApp('/', { data });
    const offer = await screen.findByRole('article', { name: /Back squat/ });
    expect(within(offer).getByText(/hasn’t moved for a few sessions/)).toBeTruthy();
    const card = screen.getByRole('link', { name: /Back squat/ });
    expect(card.textContent).toContain('@ 60'); // nothing changed yet
    fireEvent.click(within(offer).getByRole('button', { name: /^Accept/ }));
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Back squat/ }).textContent).toContain('@ 55'),
    );
    expect(screen.getByRole('link', { name: /Back squat/ }).textContent).toContain('−5');
  });

  it('a stall can be kept, with a reason', async () => {
    const data = await setup();
    await log(data, FIRST, squat(55, [8, 8]));
    for (const d of ['2026-09-08', '2026-09-11', '2026-09-15', '2026-09-19'])
      await log(data, d, squat(60, [8, 8, 8]));
    at('2026-09-22');
    await renderApp('/', { data });
    const offer = await screen.findByRole('article', { name: /Back squat/ });
    fireEvent.click(within(offer).getByRole('button', { name: /^Keep as is/ }));
    fireEvent.click(await within(offer).findByRole('button', { name: 'Not this week' }));
    await waitFor(async () =>
      expect((await data.r.changes.all()).find((c) => c.kind === 'stall')).toMatchObject({
        status: 'kept',
        keepReason: 'not_now',
      }),
    );
  });

  it(`a planned deload after ${deloadRule().default_every_n_weeks} weeks: offered, and Accept cuts sets`, async () => {
    const data = await setup();
    await log(data, FIRST, squat(55, [8, 8]));
    await log(data, '2026-09-29', squat(57.5, [8, 8, 8]));
    const deloadWeek = addDays(FIRST, deloadRule().default_every_n_weeks * 7); // week 6's Tuesday
    at(deloadWeek);
    await renderApp('/', { data });
    const offer = await screen.findByRole('article', { name: /Deload week/ });
    fireEvent.click(within(offer).getByRole('button', { name: /^Accept/ }));
    expect(await screen.findByRole('button', { name: 'Start deload session' })).toBeTruthy();
    const card = screen.getByRole('link', { name: /Back squat/ });
    expect(card.textContent).toContain('Deload');
    expect(card.textContent).toMatch(/^.*2 × /);
  });

  it('a new block with good recovery: extra sets offered; Accept updates the plan', async () => {
    const data = await setup();
    await log(data, FIRST, squat(55, [8, 8]));
    for (let w = 1; w <= 5; w++) {
      await log(data, addDays(FIRST, w * 7), squat(55 + w * 2.5, [8, 8, 8]));
      await log(data, addDays(FIRST, w * 7 + 2), squat(55 + w * 2.5, [9, 9, 9]));
    }
    const newBlock = addDays(FIRST, (deloadRule().default_every_n_weeks + 1) * 7); // week 7
    at(newBlock);
    const before = (await data.r.plans.active())!.sessions
      .flatMap((x) => x.exercises)
      .reduce((t, e) => t + e.sets, 0);
    await renderApp('/', { data });
    const offer = await screen.findByRole('article', { name: /More sets/ });
    fireEvent.click(within(offer).getByRole('button', { name: /^Accept/ }));
    await waitFor(async () => {
      const after = (await data.r.plans.active())!.sessions
        .flatMap((x) => x.exercises)
        .reduce((t, e) => t + e.sets, 0);
      expect(after).toBeGreaterThan(before);
    });
  });
});
