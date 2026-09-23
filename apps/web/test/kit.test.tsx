import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAppData } from '../src/data/DbContext.tsx';
import { TareDb } from '../src/db/index.ts';
import { DEFAULT_KIT, kitFor } from '../src/settings/kit.ts';
import { renderApp, testProfile } from './render.tsx';

describe('kit steps (P1 T2)', () => {
  it('defaults: barbell 2.5 kg from a 20 kg bar (decision #88), dumbbells 2, stacks 5', () => {
    expect(kitFor(null, 'Barbell_Squat')).toEqual({ step: 2.5, lightest: 20 });
    expect(kitFor(null, 'Incline_Dumbbell_Press')).toEqual(DEFAULT_KIT.dumbbell);
    expect(kitFor(null, 'Wide-Grip_Lat_Pulldown')).toEqual(DEFAULT_KIT.stack);
  });

  it('the user’s kit and an exercise’s own jump win', () => {
    const p = {
      kitLoads: { barbell: { step: 1, lightest: 15 } },
      stepOverrides: { Barbell_Deadlift: 5 },
    };
    expect(kitFor(p, 'Barbell_Squat')).toEqual({ step: 1, lightest: 15 });
    expect(kitFor(p, 'Barbell_Deadlift')).toEqual({ step: 5, lightest: 15 });
  });

  it('Settings → Weight steps saves the kit', async () => {
    const data = createAppData(new TareDb(`kit-${Math.random()}`));
    await data.r.profile.save({ ...testProfile, onboardedAt: 1 });
    await renderApp('/settings/weight-steps', { data });
    const barbell = (await screen.findByRole('heading', { name: 'Barbell' })).parentElement!
      .parentElement!;
    fireEvent.change(within(barbell).getByLabelText('Smallest jump · kg'), {
      target: { value: '1,25' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(async () =>
      expect((await data.r.profile.get())?.kitLoads?.['barbell']?.step).toBe(1.25),
    );
  });
});
