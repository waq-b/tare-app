// Screens need an account on this phone and a finished onboarding. Sign-in and onboarding are
// the only ways in without them.
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext.tsx';
import { useAppData } from '../data/DbContext.tsx';
import { useSyncPass } from '../sync/SyncContext.tsx';
import { Splash } from './Splash.tsx';

const loading = <main aria-busy="true" aria-label="Loading" />;
const RESTORE_CHECKED = 'restoreChecked';

/** Before onboarding on a phone with no profile, look on the server first: the account may
 * already have one (a new phone, or Safari and the installed app, which don't share storage). */
function useRestoreCheck(needed: boolean) {
  const { db } = useAppData();
  const pass = useSyncPass();
  const checked = useLiveQuery(
    async () => (await db.meta.get(RESTORE_CHECKED))?.value === true,
    [db],
  );
  const started = useRef(false);
  useEffect(() => {
    if (!needed || checked !== false || started.current) return;
    started.current = true;
    void (async () => {
      if (pass) await pass();
      await db.meta.put({ key: RESTORE_CHECKED, value: true });
    })();
  }, [needed, checked, pass, db]);
  // Without sync (tests), there's nothing to check.
  return !needed || !pass ? 'done' : checked ? 'done' : 'checking';
}

export function Gate({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const { r } = useAppData();
  const { pathname } = useLocation();
  // undefined while loading, null when there's no profile yet.
  const profile = useLiveQuery(async () => (await r.profile.get()) ?? null, [r]);
  const hasSession = state.status === 'signedIn' && state.session !== null;
  const restore = useRestoreCheck(hasSession && profile === null);

  if (pathname === '/sign-in') return children;
  // Local reads, so these last a frame or two.
  if (state.status === 'loading') return loading;
  if (state.status === 'signedOut') return <Navigate to="/sign-in" replace />;
  const onboarding = pathname.startsWith('/onboarding') || pathname === '/restore';
  if (profile === undefined) return loading;
  if (!profile?.onboardedAt && restore === 'checking') {
    return <Splash message="Looking for your data…" />;
  }
  if (!profile?.onboardedAt && !onboarding) return <Navigate to="/onboarding/welcome" replace />;
  if (profile?.onboardedAt && onboarding) return <Navigate to="/" replace />;
  return children;
}
