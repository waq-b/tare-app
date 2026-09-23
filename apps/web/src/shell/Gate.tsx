// Screens need an account on this phone and a finished onboarding. Sign-in and onboarding are
// the only ways in without them.
import { useLiveQuery } from 'dexie-react-hooks';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext.tsx';
import { useAppData } from '../data/DbContext.tsx';

const loading = <main aria-busy="true" aria-label="Loading" />;

export function Gate({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const { r } = useAppData();
  const { pathname } = useLocation();
  // undefined while loading, null when there's no profile yet.
  const profile = useLiveQuery(async () => (await r.profile.get()) ?? null, [r]);

  if (pathname === '/sign-in') return children;
  // Local reads, so these last a frame or two.
  if (state.status === 'loading') return loading;
  if (state.status === 'signedOut') return <Navigate to="/sign-in" replace />;
  const onboarding = pathname.startsWith('/onboarding');
  if (profile === undefined) return loading;
  if (!profile?.onboardedAt && !onboarding) return <Navigate to="/onboarding/welcome" replace />;
  if (profile?.onboardedAt && onboarding) return <Navigate to="/" replace />;
  return children;
}
