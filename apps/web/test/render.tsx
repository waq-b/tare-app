// Renders the real app routes at a path, with a fresh database and a fake sign-in.
import { render } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { AuthProvider } from '../src/auth/AuthContext.tsx';
import { fakeAuthClient, type FakeAuth } from '../src/auth/fake.ts';
import { createAppData, DbProvider, type AppData } from '../src/data/DbContext.tsx';
import { TareDb } from '../src/db/index.ts';
import { createTestRouter } from '../src/routes.tsx';

export interface RenderOptions {
  /** Signed in (and remembered) as this address; null = never signed in. */
  account?: string | null;
  auth?: FakeAuth;
  data?: AppData;
}

export async function renderApp(path: string, opts: RenderOptions = {}) {
  const account = opts.account === undefined ? 'test@example.com' : opts.account;
  const data = opts.data ?? createAppData(new TareDb(`app-${Math.random()}`));
  if (account) await data.db.meta.put({ key: 'account', value: account });
  const auth = opts.auth ?? fakeAuthClient(account);
  const router = createTestRouter(path);
  render(
    <DbProvider data={data}>
      <AuthProvider client={auth}>
        <RouterProvider router={router} />
      </AuthProvider>
    </DbProvider>,
  );
  return { router, data, auth };
}
