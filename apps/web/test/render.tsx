// Renders the real app routes at a path, with a fresh database and a fake sign-in.
import { render } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { AuthProvider } from '../src/auth/AuthContext.tsx';
import { fakeAuthClient, type FakeAuth } from '../src/auth/fake.ts';
import { createAppData, DbProvider, type AppData } from '../src/data/DbContext.tsx';
import { TareDb } from '../src/db/index.ts';
import { createTestRouter } from '../src/routes.tsx';
import { SyncProvider } from '../src/sync/SyncContext.tsx';
import type { SyncTransport } from '../src/sync/transport.ts';

export const testProfile = {
  goalId: 'tr.goal.fat_loss',
  goalsRanked: ['fat_loss', 'strength'],
  level: 'beginner' as const,
  daysPerWeek: 3,
  sessionMinutes: 60,
  units: 'kg' as const,
  dumbbellConvention: 'per_hand' as const,
  kit: ['barbell', 'dumbbells'],
  cantDo: [],
  region: 'england' as const,
  maxRpe: null,
  onboardedAt: null,
};

export interface RenderOptions {
  /** Signed in (and remembered) as this address; null = never signed in. */
  account?: string | null;
  /** Onboarding already done (a profile exists). Default true. */
  onboarded?: boolean;
  auth?: FakeAuth;
  data?: AppData;
  /** Run background sync against this transport (off by default). */
  transport?: SyncTransport;
}

export async function renderApp(path: string, opts: RenderOptions = {}) {
  const account = opts.account === undefined ? 'test@example.com' : opts.account;
  const data = opts.data ?? createAppData(new TareDb(`app-${Math.random()}`));
  if (account) await data.db.meta.put({ key: 'account', value: account });
  if (opts.onboarded !== false && !(await data.r.profile.get())) {
    await data.r.profile.save({ ...testProfile, onboardedAt: 1 });
  }
  const auth = opts.auth ?? fakeAuthClient(account);
  const router = createTestRouter(path);
  render(
    <DbProvider data={data}>
      <AuthProvider client={auth}>
        {opts.transport ? (
          <SyncProvider transport={opts.transport}>
            <RouterProvider router={router} />
          </SyncProvider>
        ) : (
          <RouterProvider router={router} />
        )}
      </AuthProvider>
    </DbProvider>,
  );
  return { router, data, auth };
}
