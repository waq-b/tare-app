// Screens need an account on this phone; sign-in is the only way in without one.
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext.tsx';

const OPEN = new Set(['/sign-in']);

export function Gate({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const { pathname } = useLocation();
  if (OPEN.has(pathname)) return children;
  // A local read, so this lasts a frame or two.
  if (state.status === 'loading') return <main aria-busy="true" aria-label="Loading" />;
  if (state.status === 'signedOut') return <Navigate to="/sign-in" replace />;
  return children;
}
