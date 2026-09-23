import { rawVpt, vpt } from '@tare/data';
import { act, render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createTestRouter } from '../src/routes.tsx';

function renderAt(path: string) {
  const router = createTestRouter(path);
  render(<RouterProvider router={router} />);
  return router;
}

describe('app shell', () => {
  it.each([
    ['/', 'Today'],
    ['/plan', 'Plan'],
    ['/progress', 'Progress'],
    ['/coach', 'Coach'],
  ])('%s shows the %s tab as current', (path, label) => {
    renderAt(path);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const current = nav.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe(label);
  });

  it('drill-ins and flows have no bottom nav', () => {
    renderAt('/workout');
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull();
  });

  it('nav links route in the app without a page load', async () => {
    const router = renderAt('/');
    const plan = screen.getByRole('link', { name: 'Plan' });
    await act(async () => plan.click());
    expect(router.state.location.pathname).toBe('/plan');
  });

  it('an unknown address says so and links home', () => {
    renderAt('/nope');
    expect(screen.getByText('There’s nothing here')).toBeTruthy();
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
