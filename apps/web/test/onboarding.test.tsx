import { screening } from '@tare/data';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from './render.tsx';

const sc = screening();

/** Answers every screening question, "no" unless given. */
function answer(over: Record<string, 'Yes' | 'No'> = {}) {
  sc.questions.forEach((q, i) => {
    const row = screen.getByRole('radiogroup', {
      name: new RegExp(`^${i + 1}\\b|${escape(q.text.slice(0, 30))}`),
    });
    fireEvent.click(within(row).getByRole('radio', { name: over[q.id] ?? 'No' }));
  });
}
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function start() {
  const r = await renderApp('/', { onboarded: false });
  await waitFor(() => expect(r.router.state.location.pathname).toBe('/onboarding/welcome'));
  expect(await screen.findByText('Not medical advice')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'I understand, let’s start' }));
  await screen.findByText('A few health questions');
  return r;
}

describe('onboarding', () => {
  it('a new account goes to onboarding, and the full path lands on Today with profile, screening and plan', async () => {
    const { router, data } = await start();
    answer({ currently_active: 'Yes' });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      await screen.findByText(sc.result_messages['continue_progress_as_tolerated']!),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue setup' }));
    await screen.findByText('What matters most?');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Your gym');
    fireEvent.click(screen.getByRole('button', { name: 'Build my plan' }));
    await screen.findByText('Starting weights');
    fireEvent.change(screen.getByLabelText('Back squat · kg'), { target: { value: '70,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start training' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));

    const profile = await data.r.profile.get();
    expect(profile).toMatchObject({
      goalId: 'tr.goal.fat_loss',
      daysPerWeek: 3,
      units: 'kg',
      region: 'england',
    });
    expect(profile?.onboardedAt).toBeGreaterThan(0);
    expect((await data.r.screening.latest())?.result).toBe('continue_progress_as_tolerated');
    const plan = await data.r.plans.active();
    const squat = plan?.sessions[0]?.exercises.find((e) => e.exerciseId === 'Barbell_Squat');
    expect(squat?.startLoad).toBe(70.5);
    expect(plan?.sessions[1]?.exercises[0]?.startLoad).toBeNull(); // left blank: calibration set
    expect(await data.db.meta.get('onboardingDraft')).toBeUndefined();
  });

  it('GP first: setup stops, and later steps send you back to the result', async () => {
    const { router } = await start();
    answer({ currently_active: 'Yes', symptoms: 'Yes' });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText(sc.matrix['symptoms=yes']!.message)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue setup' })).toBeNull();
    await router.navigate('/onboarding/goals');
    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding/result'));
  });

  it('cleared by GP = yes carries on, with the data’s message', async () => {
    await start();
    answer({ currently_active: 'Yes', symptoms: 'Yes' });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const gp = await screen.findByRole('radiogroup', {
      name: new RegExp(escape(sc.cleared_by_gp.question.text.slice(0, 30))),
    });
    fireEvent.click(within(gp).getByRole('radio', { name: 'Yes' }));
    expect(await screen.findByText(sc.cleared_by_gp.if_yes.message)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue setup' }));
    expect(await screen.findByText('What matters most?')).toBeTruthy();
  });

  it('cleared by GP = no: NHS links, and answers can be saved without a profile', async () => {
    const { data } = await start();
    answer({ supervised_only: 'Yes' });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const gp = await screen.findByRole('radiogroup', {
      name: new RegExp(escape(sc.cleared_by_gp.question.text.slice(0, 30))),
    });
    fireEvent.click(within(gp).getByRole('radio', { name: 'No' }));
    expect(await screen.findByText(sc.cleared_by_gp.if_no.message)).toBeTruthy();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Save my answers' }));
    expect(await screen.findByText('Answers saved')).toBeTruthy();
    expect((await data.r.screening.latest())?.clearedByGp).toBe('no');
    expect(await data.r.profile.get()).toBeUndefined();
  });

  it('a joint problem needs an area (and side) before going on, then is noted', async () => {
    await start();
    answer({ currently_active: 'Yes', msk_issue: 'Yes' });
    const next = screen.getByRole('button', { name: 'Continue' });
    expect(next).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'Knee' }));
    expect(next).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('radio', { name: 'Left' }));
    expect(next).toHaveProperty('disabled', false);
    fireEvent.click(next);
    expect(await screen.findByText(sc.matrix['msk_issue=yes']!.message)).toBeTruthy();
    expect(screen.getByText('Left knee noted')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue setup' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Build my plan' }));
    expect(
      await screen.findByText('Changed to go easy on the area you told us about'),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Back squat · kg')).toBeNull();
  });

  it('answers survive a reload', async () => {
    const { data } = await start();
    answer({ currently_active: 'Yes' });
    await waitFor(async () =>
      expect(
        ((await data.db.meta.get('onboardingDraft'))?.value as { answers: object }).answers,
      ).toMatchObject({
        currently_active: 'yes',
      }),
    );
  });

  it('taps in one burst all count (no answer overwrites another)', async () => {
    await start();
    const groups = screen.getAllByRole('radiogroup');
    act(() => {
      for (const g of groups) within(g).getByRole('radio', { name: 'No' }).click();
    });
    for (const g of groups) {
      expect(within(g).getByRole('radio', { name: 'No' }).getAttribute('aria-checked')).toBe(
        'true',
      );
    }
  });
});
