import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppData, type AppData } from '../src/data/DbContext.tsx';
import { TareDb, type WorkoutExercise } from '../src/db/index.ts';
import { seedPlan } from '../src/seed/plan.ts';
import { DEFAULT_DRAFT } from '../src/screens/onboarding/draft.ts';
import type { Rest } from '../src/workout/rest.ts';
import { setDoubleTapMs } from '../src/screens/Workout.tsx';
import { renderApp, testProfile } from './render.tsx';

const squat: WorkoutExercise = {
  exerciseId: 'Barbell_Squat',
  swappedFrom: null,
  skipped: false,
  sets: 3,
  repRange: [6, 10],
  restSec: 120,
  load: 80,
};
const bench: WorkoutExercise = {
  ...squat,
  exerciseId: 'Barbell_Bench_Press_-_Medium_Grip',
  load: null,
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 22, 18));
});
afterEach(() => vi.useRealTimers());

async function start(exercises: WorkoutExercise[], withPlan = false) {
  const data = createAppData(new TareDb(`wk-${Math.random()}`));
  await data.r.profile.save({ ...testProfile, kit: DEFAULT_DRAFT.kit, onboardedAt: 1 });
  let planId: string | null = null;
  if (withPlan) {
    const { plan } = seedPlan({
      goalId: 'tr.goal.fat_loss',
      daysPerWeek: 3,
      kit: DEFAULT_DRAFT.kit,
      cantDo: DEFAULT_DRAFT.cantDo,
      startedOn: '2026-09-21',
    });
    planId = (await data.r.plans.activate(plan)).id;
  }
  const workout = await data.r.workouts.start({
    planId,
    sessionKey: 'A',
    date: '2026-09-22',
    exercises,
  });
  const r = await renderApp('/workout', { data });
  await screen.findByRole('heading', {
    name: exercises[0] === bench ? 'Bench press' : 'Back squat',
  });
  return { ...r, data, workout };
}

const sets = (data: AppData, id: string) => data.r.sets.forWorkout(id);
const rest = async (data: AppData) => (await data.db.meta.get('rest'))?.value as Rest | undefined;
const doneButton = () => screen.getByRole('button', { name: /^Done/ });
const closeSheet = () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

describe('the Ledger', () => {
  it('one tap logs the current set as planned and starts the rest timer', async () => {
    const { data, workout } = await start([squat]);
    expect(doneButton().textContent).toContain('80 × 6');
    fireEvent.click(doneButton());
    await waitFor(async () => expect(await sets(data, workout.id)).toHaveLength(1));
    expect((await sets(data, workout.id))[0]).toMatchObject({ kind: 'work', load: 80, reps: 6 });
    const dialog = await screen.findByRole('dialog', { name: 'Rest' });
    expect(within(dialog).getByRole('timer').getAttribute('aria-label')).toMatch(
      /left of 2 minutes/,
    );
    expect((await rest(data))?.until).toBe(Date.now() + 120_000);
  });

  it('effort after a set is saved on that set, and is optional', async () => {
    const { data, workout } = await start([squat]);
    fireEvent.click(doneButton());
    const dialog = await screen.findByRole('dialog', { name: 'Rest' });
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Hard' }));
    await waitFor(async () => expect((await sets(data, workout.id))[0]?.effort).toBe('hard'));
  });

  it('the check on a done set undoes it', async () => {
    const { data, workout } = await start([squat]);
    fireEvent.click(doneButton());
    await screen.findByRole('dialog', { name: 'Rest' });
    closeSheet();
    fireEvent.click(await screen.findByRole('button', { name: 'Set 1 done, undo' }));
    await waitFor(async () => expect(await sets(data, workout.id)).toHaveLength(0));
    expect(await rest(data)).toBeUndefined();
  });

  it('rest runs on the wall clock: after the screen was locked for longer, it has ended (and buzzed)', async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    const { data } = await start([squat]);
    fireEvent.click(doneButton());
    await screen.findByRole('dialog', { name: 'Rest' });
    vi.setSystemTime(Date.now() + 121_000);
    await waitFor(async () => expect(await rest(data)).toBeUndefined(), { timeout: 2000 });
    expect(vibrate).toHaveBeenCalled();
  });

  it('no known weight: Done asks for it, logs it, and uses it for the rest of the sets', async () => {
    const { data, workout } = await start([bench]);
    expect(doneButton).toThrow(); // it says "Enter weight" instead
    fireEvent.click(screen.getByRole('button', { name: 'Enter weight' }));
    const dialog = await screen.findByRole('dialog', { name: 'Set 1' });
    for (let i = 0; i < 8; i++)
      fireEvent.click(within(dialog).getByRole('button', { name: '+5 kg' }));
    fireEvent.click(within(dialog).getByRole('button', { name: /^Log/ }));
    await waitFor(async () => expect(await sets(data, workout.id)).toHaveLength(1));
    expect((await sets(data, workout.id))[0]).toMatchObject({ load: 40, reps: 6 });
    expect((await data.r.workouts.get(workout.id))?.exercises[0]?.load).toBe(40);
  });

  it('add set and skip set change how many sets are planned', async () => {
    const { data, workout } = await start([squat]);
    fireEvent.click(screen.getByRole('button', { name: 'Add set' }));
    await waitFor(async () =>
      expect((await data.r.workouts.get(workout.id))?.exercises[0]?.sets).toBe(4),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Skip set' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Skip set' }));
    await waitFor(async () =>
      expect((await data.r.workouts.get(workout.id))?.exercises[0]?.sets).toBe(2),
    );
  });

  it('resumes where it was after the app is closed and reopened', async () => {
    const { data, workout } = await start([squat]);
    fireEvent.click(doneButton());
    await waitFor(async () => expect(await sets(data, workout.id)).toHaveLength(1));
    cleanup();
    await renderApp('/workout', { data });
    expect(await screen.findByRole('button', { name: 'Set 1 done, undo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mark set 2 done as planned' })).toBeTruthy();
  });

  it('after the last set: next exercise, then finish, then Done closes the workout', async () => {
    const { data, workout, router } = await start([
      squat,
      { ...squat, exerciseId: 'Leg_Press', load: 100, sets: 1 },
    ]);
    for (let i = 0; i < 3; i++) {
      fireEvent.click(doneButton());
      await screen.findByRole('dialog', { name: 'Rest' });
      closeSheet();
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Next exercise' }));
    await screen.findByRole('heading', { name: 'Leg press' });
    fireEvent.click(doneButton());
    await screen.findByRole('dialog', { name: 'Rest' });
    closeSheet();
    fireEvent.click(await screen.findByRole('button', { name: 'Finish workout' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/workout/finish'));
    expect(await screen.findByText('Session done.')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Good' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    const w = await data.r.workouts.get(workout.id);
    expect(w?.finishedAt).not.toBeNull();
    expect(w?.feel).toBe('good');
    expect(await rest(data)).toBeUndefined();
    expect(await screen.findByText('Done for today.')).toBeTruthy();
  });

  it('swap today replaces the exercise for this workout only', async () => {
    const { data, workout } = await start([squat], true);
    fireEvent.click(screen.getByRole('button', { name: /^Swap\s*Back squat$/ }));
    const dialog = await screen.findByRole('dialog');
    const first = within(dialog).getAllByRole('button', { pressed: false })[0];
    if (first) fireEvent.click(first);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Swap today' }));
    await waitFor(async () =>
      expect((await data.r.workouts.get(workout.id))?.exercises[0]?.swappedFrom).toBe(
        'Barbell_Squat',
      ),
    );
    const plan = await data.r.plans.active();
    expect(plan?.sessions[0]?.exercises[0]?.exerciseId).toBe('Barbell_Squat');
  });

  it('swap in plan changes the plan too', async () => {
    const { data, workout } = await start([squat], true);
    fireEvent.click(screen.getByRole('button', { name: /^Swap\s*Back squat$/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Swap in plan' }));
    await waitFor(async () =>
      expect((await data.r.workouts.get(workout.id))?.exercises[0]?.swappedFrom).toBe(
        'Barbell_Squat',
      ),
    );
    const now = (await data.r.workouts.get(workout.id))?.exercises[0]?.exerciseId;
    await waitFor(async () =>
      expect((await data.r.plans.active())?.sessions[0]?.exercises[0]?.exerciseId).toBe(now),
    );
  });

  it('a double tap on the footer acts once (Next exercise doesn’t log the next set)', async () => {
    setDoubleTapMs(600);
    try {
      const { data, workout } = await start([
        { ...squat, sets: 1 },
        { ...squat, exerciseId: 'Leg_Press', load: 100 },
      ]);
      fireEvent.click(doneButton());
      await screen.findByRole('dialog', { name: 'Rest' });
      closeSheet();
      await new Promise((r) => setTimeout(r, 650));
      fireEvent.click(await screen.findByRole('button', { name: 'Next exercise' }));
      await screen.findByRole('heading', { name: 'Leg press' });
      // The second tap of a double tap lands on what is now Done.
      fireEvent.click(doneButton());
      await new Promise((r) => setTimeout(r, 100));
      expect(screen.queryByRole('dialog', { name: 'Rest' })).toBeNull();
      const legPress = (await sets(data, workout.id)).filter((x) => x.exerciseId === 'Leg_Press');
      expect(legPress).toHaveLength(0);
    } finally {
      setDoubleTapMs(0);
    }
  });

  it('with no workout in progress, /workout goes to Today', async () => {
    const { router } = await renderApp('/workout');
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });
});
