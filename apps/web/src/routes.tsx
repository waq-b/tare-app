// Every route in the app. Tab screens sit inside the shell (bottom nav); drill-ins and flows
// (workout, onboarding, safety) are full screen. Screens fill in over P0 T5–T9.
import { createBrowserRouter, createMemoryRouter, Navigate, type RouteObject } from 'react-router';
import { AppShell } from './shell/AppShell.tsx';
import { Placeholder } from './screens/Placeholder.tsx';
import { NotFound } from './screens/NotFound.tsx';
import { Onboarding } from './screens/onboarding/Onboarding.tsx';
import { Exercise } from './screens/Exercise.tsx';
import { History, SessionDetail } from './screens/History.tsx';
import { Progress } from './screens/Progress.tsx';
import { Finish } from './screens/Finish.tsx';
import { FlagPain, PainFlags } from './screens/Pain.tsx';
import { Plan, PlanSession } from './screens/Plan.tsx';
import { Restore } from './screens/Restore.tsx';
import { Safety } from './screens/Safety.tsx';
import { Settings } from './screens/Settings.tsx';
import { Today } from './screens/Today.tsx';
import { Workout } from './screens/Workout.tsx';
import { SignIn } from './screens/SignIn.tsx';

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Today /> },
      { path: 'plan', element: <Plan /> },
      { path: 'plan/:key', element: <PlanSession /> },
      { path: 'progress', element: <Progress /> },
      { path: 'coach', element: <Placeholder tab="coach" title="Coach" /> },
      { path: 'exercise/:exerciseId', element: <Exercise /> },
      { path: 'history', element: <History /> },
      { path: 'history/:sessionId', element: <SessionDetail /> },
      { path: 'body', element: <Navigate to="/progress?view=body" replace /> },
      { path: 'settings', element: <Settings /> },
      { path: 'workout', element: <Workout /> },
      { path: 'workout/finish', element: <Finish /> },
      { path: 'pain', element: <FlagPain /> },
      { path: 'pain-flags', element: <PainFlags /> },
      { path: 'safety/:ruleId', element: <Safety /> },
      { path: 'sign-in', element: <SignIn /> },
      { path: 'onboarding/:step?', element: <Onboarding /> },
      { path: 'restore', element: <Restore /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);

/** For tests: the same routes in memory. */
export const createTestRouter = (path = '/') =>
  createMemoryRouter(routes, { initialEntries: [path] });
