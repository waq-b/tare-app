// Every route in the app. Tab screens sit inside the shell (bottom nav); drill-ins and flows
// (workout, onboarding, safety) are full screen. Screens fill in over P0 T5–T9.
import { createBrowserRouter, createMemoryRouter, type RouteObject } from 'react-router';
import { AppShell } from './shell/AppShell.tsx';
import { Placeholder } from './screens/Placeholder.tsx';
import { NotFound } from './screens/NotFound.tsx';

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Placeholder tab="today" title="Today" /> },
      { path: 'plan', element: <Placeholder tab="plan" title="Plan" /> },
      { path: 'progress', element: <Placeholder tab="progress" title="Progress" /> },
      { path: 'coach', element: <Placeholder tab="coach" title="Coach" /> },
      { path: 'exercise/:exerciseId', element: <Placeholder title="Exercise" back="/plan" /> },
      { path: 'history', element: <Placeholder title="History" back="/progress" /> },
      { path: 'history/:sessionId', element: <Placeholder title="Session" back="/history" /> },
      { path: 'body', element: <Placeholder title="Body" back="/progress" /> },
      { path: 'settings', element: <Placeholder title="Settings" back="/" /> },
      { path: 'workout', element: <Placeholder title="Workout" back="/" /> },
      { path: 'workout/finish', element: <Placeholder title="Finish" back="/workout" /> },
      { path: 'safety/:ruleId', element: <Placeholder title="Safety" back="/" /> },
      { path: 'sign-in', element: <Placeholder title="Sign in" /> },
      { path: 'onboarding/*', element: <Placeholder title="Set up" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);

/** For tests: the same routes in memory. */
export const createTestRouter = (path = '/') =>
  createMemoryRouter(routes, { initialEntries: [path] });
