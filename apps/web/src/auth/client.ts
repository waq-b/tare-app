// What the app needs from sign-in, and nothing more (the pattern from pip, decision #68).
// Supabase sits behind this interface so screens never import it, and tests use a fake.
import { createClient, type Session } from '@supabase/supabase-js';

export interface AuthSession {
  accessToken: string;
  email: string | null;
}

export interface AuthClient {
  /** The current session, refreshed by Supabase if its token was expiring. */
  getSession(): Promise<AuthSession | null>;
  /** Called on sign-in, sign-out and token refresh. Returns an unsubscribe. */
  onChange(listener: (session: AuthSession | null) => void): () => void;
  /**
   * Emails a one-time sign-in code. The email also carries a link as a fallback for desktop
   * browsers; an installed PWA can't use the link, because it opens the system browser, whose
   * storage the app doesn't share. Throws `TooManyEmailsError` at Supabase's send limit.
   */
  sendCode(email: string): Promise<void>;
  /** Signs in with the emailed code. Throws `WrongCodeError` or `TooManyTriesError`. */
  verifyCode(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
}

/** Must match Supabase → Auth → Email OTP length. */
export const SIGN_IN_CODE_LENGTH = 8;

export class TooManyEmailsError extends Error {
  override name = 'TooManyEmailsError';
  constructor() {
    super('Too many sign-in emails');
  }
}

/** Wrong, expired or used, or for an address Tare doesn't know (never says which). */
export class WrongCodeError extends Error {
  override name = 'WrongCodeError';
  constructor() {
    super('Wrong or expired sign-in code');
  }
}

export class TooManyTriesError extends Error {
  override name = 'TooManyTriesError';
  constructor() {
    super('Too many sign-in code attempts');
  }
}

export function supabaseAuthClient(
  url: string | undefined = import.meta.env['VITE_SUPABASE_URL'] as string | undefined,
  key: string | undefined = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined,
): AuthClient {
  if (!url || !key) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set');
  }
  const supabase = createClient(url, key);
  const toSession = (s: Session | null): AuthSession | null =>
    s ? { accessToken: s.access_token, email: s.user.email ?? null } : null;

  return {
    async getSession() {
      const { data } = await supabase.auth.getSession();
      return toSession(data.session);
    },
    onChange(listener) {
      const { data } = supabase.auth.onAuthStateChange((_e, s) => listener(toSession(s)));
      return () => data.subscription.unsubscribe();
    },
    async sendCode(email) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        // Accounts are made by the allowlist, never here (sign-ups are off in Supabase too).
        options: { emailRedirectTo: `${window.location.origin}/`, shouldCreateUser: false },
      });
      if (!error) return;
      // No account for this address: answer exactly as for a real one (no enumeration).
      if (error.code === 'otp_disabled' || /signups not allowed/i.test(error.message)) return;
      if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
        throw new TooManyEmailsError();
      }
      throw error;
    },
    async verifyCode(email, code) {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (!error) return;
      if (error.status === 429 || error.code === 'over_request_rate_limit') {
        throw new TooManyTriesError();
      }
      if (error.status === 400 || error.status === 403 || error.code === 'otp_expired') {
        throw new WrongCodeError();
      }
      throw error;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };
}
