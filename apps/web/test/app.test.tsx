import { rawVpt, vpt } from '@tare/data';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from './render.tsx';

const renderAt = (path: string) => renderApp(path);

describe('app shell', () => {
  it.each([
    ['/', 'Today'],
    ['/plan', 'Plan'],
    ['/progress', 'Progress'],
    ['/coach', 'Coach'],
  ])('%s shows the %s tab as current', async (path, label) => {
    await renderAt(path);
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    const current = nav.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe(label);
  });

  it('drill-ins and flows have no bottom nav', async () => {
    await renderAt('/workout');
    await screen.findByText('Workout is on its way');
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull();
  });

  it('nav links route in the app without a page load', async () => {
    const { router } = await renderAt('/');
    const plan = await screen.findByRole('link', { name: 'Plan' });
    await act(async () => plan.click());
    expect(router.state.location.pathname).toBe('/plan');
  });

  it('an unknown address says so and links home', async () => {
    await renderAt('/nope');
    expect(await screen.findByText('There’s nothing here')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to Today' }).getAttribute('href')).toBe('/');
  });
});

describe('app data', () => {
  it('loads the slim bundle, not the full vpt set', () => {
    expect((rawVpt.exercises as { slim?: string }).slim).toBeDefined();
    expect(
      vpt().exercises.every(
        (e) => e.staple || vpt().exercises.some((s) => s.swaps.some((w) => w.id === e.id)),
      ),
    ).toBe(true);
  });
});
