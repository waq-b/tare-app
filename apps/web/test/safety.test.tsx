import { exercisesLoading, safetyRule, safetyRules } from '@tare/data';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppData, type AppData } from '../src/data/DbContext.tsx';
import { TareDb, type WorkoutExercise } from '../src/db/index.ts';
import { seedPlan } from '../src/seed/plan.ts';
import { DEFAULT_DRAFT } from '../src/screens/onboarding/draft.ts';
import { renderApp, testProfile } from './render.tsx';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 22, 18)); // Tuesday: session A
});
afterEach(() => vi.useRealTimers());

const ex = (exerciseId: string, load: number | null = 50): WorkoutExercise => ({
  exerciseId,
  swappedFrom: null,
  skipped: false,
  sets: 3,
  repRange: [8, 12],
  restSec: 90,
  load,
});
// Bench and incline DB load the shoulder as primary (body_area_map); squat and leg press don't.
const SESSION = [
  ex('Barbell_Bench_Press_-_Medium_Grip', 60),
  ex('Barbell_Squat', 80),
  ex('Incline_Dumbbell_Press', 16),
  ex('Leg_Press', 100),
];

async function newData(withPlan = false): Promise<AppData> {
  const data = createAppData(new TareDb(`sf-${Math.random()}`));
  await data.r.profile.save({ ...testProfile, kit: DEFAULT_DRAFT.kit, onboardedAt: 1 });
  if (withPlan) {
    const { plan } = seedPlan({
      goalId: 'tr.goal.fat_loss',
      daysPerWeek: 3,
      kit: DEFAULT_DRAFT.kit,
      cantDo: DEFAULT_DRAFT.cantDo,
      startedOn: '2026-09-21',
    });
    await data.r.plans.activate(plan);
  }
  return data;
}

async function inWorkout() {
  const data = await newData();
  const workout = await data.r.workouts.start({
    planId: null,
    sessionKey: 'B',
    date: '2026-09-22',
    exercises: SESSION,
  });
  const r = await renderApp('/workout', { data });
  await screen.findByRole('heading', { name: 'Bench press' });
  fireEvent.click(screen.getByRole('button', { name: 'Flag pain' }));
  const sheet = await screen.findByRole('dialog', { name: 'Flag pain' });
  return { ...r, data, workout, sheet };
}

const message = () => screen.findByTestId('safety-message');

describe('safety screens in the app (hard line 3)', () => {
  it.each(safetyRules().map((r) => [r.id, r] as const))(
    '%s: user_message shown word for word',
    async (id, rule) => {
      await renderApp(`/safety/${id}`, { data: await newData() });
      expect((await message()).textContent).toBe(rule.user_message);
      cleanup();
    },
  );

  it('an unknown rule never shows a made-up message', async () => {
    const { router } = await renderApp('/safety/not_a_rule');
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });
});

describe('flag pain in a workout', () => {
  it('sharp shoulder pain during a set → modify: stops bench, skips what loads the shoulder', async () => {
    const { sheet, data, workout, router } = await inWorkout();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Shoulder' }));
    fireEvent.click(within(sheet).getByRole('radio', { name: /came on during a set/ }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Continue' }));
    expect((await message()).textContent).toBe(safetyRule('pain_during_exercise').user_message);
    expect(router.state.location.pathname).toBe('/safety/pain_during_exercise');

    const shoulder = new Set(exercisesLoading('shoulder', 'primary'));
    const expected = SESSION.map((e) => e.exerciseId).filter(
      (id, i) => i === 0 || shoulder.has(id),
    );
    const [flag] = await data.r.painFlags.active();
    expect(flag).toMatchObject({ area: 'shoulder', side: 'right', ruleId: 'pain_during_exercise' });
    expect(flag?.skippedExerciseIds.sort()).toEqual([...expected].sort());
    expect(screen.getByText(/Skipped today \(they load your right shoulder\)/)).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: 'Continue with changes' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/workout'));
    expect(await screen.findByRole('heading', { name: 'Back squat' })).toBeTruthy();
    const w = await data.r.workouts.get(workout.id);
    expect(
      w?.exercises
        .filter((e) => e.skipped)
        .map((e) => e.exerciseId)
        .sort(),
    ).toEqual([...expected].sort());
  });

  it.each([
    ['calf', 'calf is hot', 'calf_hot_swollen', 'stop_now_call_999'],
    ['ankle', 'Can’t put weight on it', 'injury_cant_bear_weight', 'stop_and_contact_111'],
    ['knee', 'Swelling or bruising', 'suspected_sprain_strain', 'reduce_or_rest'],
  ])('%s + “%s” → %s (%s)', async (area, sign, ruleId, action) => {
    const { sheet } = await inWorkout();
    fireEvent.click(
      within(sheet).getByRole('button', { name: area.charAt(0).toUpperCase() + area.slice(1) }),
    );
    fireEvent.click(within(sheet).getByRole('checkbox', { name: new RegExp(sign) }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Continue' }));
    expect((await message()).textContent).toBe(safetyRule(ruleId).user_message);
    expect(safetyRule(ruleId).action).toBe(action);
    expect(screen.getByRole('link', { name: 'End session' })).toBeTruthy();
    if (action === 'stop_now_call_999') {
      expect(screen.getAllByRole('link')[0]?.getAttribute('href')).toBe('tel:999');
    }
  });

  it('lasted more than a week → see your GP', async () => {
    const { sheet } = await inWorkout();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Knee' }));
    fireEvent.click(within(sheet).getByRole('radio', { name: /lasted more than a week/ }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Continue' }));
    expect((await message()).textContent).toBe(safetyRule('pain_not_doms').user_message);
    expect(safetyRule('pain_not_doms').action).toBe('stop_and_see_gp');
  });

  it('muscle soreness after training → continue with caution, back to the workout', async () => {
    const { sheet, router } = await inWorkout();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Hip' }));
    fireEvent.click(within(sheet).getByRole('radio', { name: /Dull soreness/ }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Continue' }));
    expect((await message()).textContent).toBe(safetyRule('doms_normal').user_message);
    fireEvent.click(screen.getByRole('link', { name: 'Back to workout' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/workout'));
  });

  it('the chest-pain shortcut goes straight to 999', async () => {
    const { sheet, data } = await inWorkout();
    fireEvent.click(within(sheet).getByRole('button', { name: /Chest pain/ }));
    expect((await message()).textContent).toBe(safetyRule('chest_pain_emergency').user_message);
    expect((await data.r.painFlags.all())[0]).toMatchObject({
      area: null,
      ruleId: 'chest_pain_emergency',
    });
  });
});

describe('when a flag leaves nothing', () => {
  it('says so and offers Finish', async () => {
    const data = await newData();
    await data.r.workouts.start({
      planId: null,
      sessionKey: 'B',
      date: '2026-09-22',
      exercises: [ex('Barbell_Bench_Press_-_Medium_Grip', 60), ex('Incline_Dumbbell_Press', 16)],
    });
    await renderApp('/workout', { data });
    fireEvent.click(await screen.findByRole('button', { name: 'Flag pain' }));
    const sheet = await screen.findByRole('dialog', { name: 'Flag pain' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Shoulder' }));
    fireEvent.click(within(sheet).getByRole('radio', { name: /came on during a set/ }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('link', { name: 'Continue with changes' }));
    expect(await screen.findByText('That’s all for today.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Finish workout' })).toBeTruthy();
  });
});

describe('after a flag', () => {
  it('the next session leaves out what loads the area, until it’s settled', async () => {
    const data = await newData(true);
    await data.r.painFlags.raise({
      date: '2026-09-20',
      area: 'knee',
      side: 'left',
      ruleId: 'pain_during_exercise',
      workoutId: null,
      exerciseId: 'Barbell_Squat',
      skippedExerciseIds: ['Barbell_Squat'],
    });
    const { router } = await renderApp('/', { data });
    expect(await screen.findByText(/Left out while your knee settles/)).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Back squat/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Start workout' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/workout'));
    const w = await data.r.workouts.unfinished();
    expect(w?.exercises.find((e) => e.exerciseId === 'Barbell_Squat')?.skipped).toBe(true);
    expect(w?.exercises[w.current]?.skipped).toBe(false);
  });

  it('pain flag history: clearing a flag brings the exercises back', async () => {
    const data = await newData(true);
    await data.r.painFlags.raise({
      date: '2026-09-20',
      area: 'knee',
      side: 'left',
      ruleId: 'pain_during_exercise',
      workoutId: null,
      exerciseId: null,
      skippedExerciseIds: [],
    });
    const { router } = await renderApp('/pain-flags', { data });
    expect(await screen.findByText('Left knee · Sun 20 Sep')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'It’s settled' }));
    await waitFor(async () => expect(await data.r.painFlags.active()).toEqual([]));
    await router.navigate('/');
    expect(await screen.findByRole('link', { name: /Back squat/ })).toBeTruthy();
  });

  it('flagging pain outside a workout ends on the safety screen with Done', async () => {
    const data = await newData();
    await renderApp('/pain', { data });
    fireEvent.click(await screen.findByRole('button', { name: 'Neck' }));
    fireEvent.click(screen.getByRole('radio', { name: /hasn’t settled in 6 weeks/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect((await message()).textContent).toBe(safetyRule('pain_not_settling_6wk').user_message);
    expect(screen.getByRole('link', { name: 'Done' })).toBeTruthy();
  });
});
