// Who's using the app. Signing in once is needed; after that the account is remembered on the
// phone (meta "account"), so the app opens and logs with no network (hard line 4). An expired
// or revoked session only stops sync, which asks to sign in again (T11); it never locks logging.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAppData } from '../data/DbContext.tsx';
import type { AuthClient, AuthSession } from './client.ts';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; email: string; session: AuthSession | null };

interface AuthValue {
  state: AuthState;
  client: AuthClient;
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ client, children }: { client: AuthClient; children: ReactNode }) {
  const { db } = useAppData();
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const remember = useCallback(
    async (session: AuthSession | null) => {
      const account = (await db.meta.get('account'))?.value as string | undefined;
      const email = session?.email ?? account;
      if (session?.email && session.email !== account) {
        await db.meta.put({ key: 'account', value: session.email });
      }
      setState(email ? { status: 'signedIn', email, session } : { status: 'signedOut' });
    },
    [db],
  );

  useEffect(() => {
    let live = true;
    // The remembered account first, so an offline start never waits on the network.
    void db.meta.get('account').then((m) => {
      if (live && typeof m?.value === 'string') {
        setState({ status: 'signedIn', email: m.value, session: null });
      }
    });
    void client
      .getSession()
      .catch(() => null)
      .then((s) => {
        if (live) void remember(s);
      });
    const off = client.onChange((s) => {
      if (s) void remember(s);
    });
    return () => {
      live = false;
      off();
    };
  }, [client, db, remember]);

  const value = useMemo<AuthValue>(
    () => ({
      state,
      client,
      sendCode: (email) => client.sendCode(email),
      verifyCode: async (email, code) => {
        await client.verifyCode(email, code);
        await remember(await client.getSession());
      },
      signOut: async () => {
        await client.signOut().catch(() => undefined);
        await db.meta.delete('account');
        setState({ status: 'signedOut' });
      },
    }),
    [state, client, db, remember],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside <AuthProvider>');
  return v;
}
