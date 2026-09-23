import '@tare/ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthContext.tsx';
import { supabaseAuthClient } from './auth/client.ts';
import { createAppData, DbProvider } from './data/DbContext.tsx';
import { requestPersistence } from './db/index.ts';
import { createAppRouter } from './routes.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from index.html');

const data = createAppData();
// Ask once at start-up; the answer shows in Settings.
void requestPersistence(data.db);

createRoot(root).render(
  <StrictMode>
    <DbProvider data={data}>
      <AuthProvider client={supabaseAuthClient()}>
        <RouterProvider router={createAppRouter()} />
      </AuthProvider>
    </DbProvider>
  </StrictMode>,
);
