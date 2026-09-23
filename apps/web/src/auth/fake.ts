// A stand-in AuthClient for tests and local previews without Supabase.
import {
  SIGN_IN_CODE_LENGTH,
  TooManyEmailsError,
  TooManyTriesError,
  WrongCodeError,
  type AuthClient,
  type AuthSession,
} from './client.ts';

export interface FakeAuth extends AuthClient {
  sent: string[];
  /** The code that works. */
  code: string;
  failNextSend: 'limit' | null;
  failNextVerify: 'tries' | null;
}

export function fakeAuthClient(signedInAs: string | null = null): FakeAuth {
  let session: AuthSession | null = signedInAs ? { accessToken: 'fake', email: signedInAs } : null;
  const listeners = new Set<(s: AuthSession | null) => void>();
  const emit = () => listeners.forEach((l) => l(session));
  const fake: FakeAuth = {
    sent: [],
    code: '1'.repeat(SIGN_IN_CODE_LENGTH),
    failNextSend: null,
    failNextVerify: null,
    getSession: async () => session,
    onChange(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    async sendCode(email) {
      if (fake.failNextSend) {
        fake.failNextSend = null;
        throw new TooManyEmailsError();
      }
      fake.sent.push(email);
    },
    async verifyCode(email, code) {
      if (fake.failNextVerify) {
        fake.failNextVerify = null;
        throw new TooManyTriesError();
      }
      if (code !== fake.code || !fake.sent.includes(email)) throw new WrongCodeError();
      session = { accessToken: 'fake', email };
      emit();
    },
    async signOut() {
      session = null;
      emit();
    },
  };
  return fake;
}
