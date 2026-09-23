import '@tare/ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthContext.tsx';
import { supabaseAuthClient } from './auth/client.ts';
import { fakeAuthClient } from './auth/fake.ts';
import { createAppData, DbProvider } from './data/DbContext.tsx';
import { requestPersistence } from './db/index.ts';
import { createAppRouter } from './routes.tsx';
import { SyncProvider } from './sync/SyncContext.tsx';
import { httpTransport } from './sync/transport.ts';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from index.html');

const data = createAppData();
// The end-to-end build (vite --mode e2e) signs in with a fake: code 11111111, any address.
// Production builds never take this branch.
const auth = import.meta.env.MODE === 'e2e' ? e2eAuth() : supabaseAuthClient();

function e2eAuth() {
  const fake = fakeAuthClient(localStorage.getItem('e2e-session'));
  fake.onChange((s) =>
    s?.email
      ? localStorage.setItem('e2e-session', s.email)
      : localStorage.removeItem('e2e-session'),
  );
  return fake;
}
const transport = httpTransport(
  (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3000',
  async () => (await auth.getSession())?.accessToken ?? null,
);
// Ask once at start-up; the answer shows in Settings.
void requestPersistence(data.db);

createRoot(root).render(
  <StrictMode>
    <DbProvider data={data}>
      <AuthProvider client={auth}>
        <SyncProvider transport={transport}>
          <RouterProvider router={createAppRouter()} />
        </SyncProvider>
      </AuthProvider>
    </DbProvider>
  </StrictMode>,
);
