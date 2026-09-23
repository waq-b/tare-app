// Sign in with an emailed 8-digit code, like pip (decision #68). A code, not a link, because
// the link opens the system browser, and an app on the Home Screen keeps its own storage.
// The email's link still works in a desktop browser.
import { Icon } from '@tare/icons';
import { Button, MiniquestTag, StatusHero, TextField, TextLink, Wordmark } from '@tare/ui';
import { useRef, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../auth/AuthContext.tsx';
import {
  SIGN_IN_CODE_LENGTH,
  TooManyEmailsError,
  TooManyTriesError,
  WrongCodeError,
} from '../auth/client.ts';
import s from './screens.module.css';

const sendFailure = (e: unknown) =>
  e instanceof TooManyEmailsError
    ? 'Tare has sent too many sign-in emails for now. Try again in an hour, and use the newest code you have.'
    : 'Tare couldn’t send the code. Check you’re online, then try again.';

export function SignIn() {
  const { state, sendCode } = useAuth();
  const [email, setEmail] = useState('');
  const [codeFor, setCodeFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // Signed in with a live session: nothing to do. A remembered account without one (it
  // expired) can sign in again here to resume sync.
  if (state.status === 'signedIn' && state.session) return <Navigate to="/" replace />;

  async function send(e: FormEvent) {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setSending(true);
    setFailure(null);
    try {
      await sendCode(address);
      setCodeFor(address);
    } catch (err) {
      setFailure(sendFailure(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className={s['body']} style={{ paddingTop: 56, gap: 24 }}>
      <div className={s['stack']}>
        <MiniquestTag />
        <Wordmark size={52} />
      </div>
      {codeFor ? (
        <CodeStep email={codeFor} onRestart={() => setCodeFor(null)} />
      ) : (
        <form onSubmit={(e) => void send(e)} className={s['stack']}>
          <p className={s['lede']}>Sign in with your email. No password: we send you a code.</p>
          <TextField
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            disabled={sending}
            hint="Invite-only for now."
            error={failure}
          />
          <Button type="submit" size={60} fullWidth disabled={sending || !email.trim()}>
            {sending ? 'Sending your code…' : 'Email me a code'}
          </Button>
        </form>
      )}
    </main>
  );
}

type CodeStatus =
  | { kind: 'typing' }
  | { kind: 'checking' }
  | { kind: 'resending' }
  | { kind: 'resent' }
  | { kind: 'failed'; message: string };

function CodeStep({ email, onRestart }: { email: string; onRestart: () => void }) {
  const { sendCode, verifyCode } = useAuth();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<CodeStatus>({ kind: 'typing' });
  const busy = status.kind === 'checking' || status.kind === 'resending';
  const checking = useRef(false);

  // Once only: every extra try against a wrong or used code counts towards Supabase's limit.
  async function check(digits: string) {
    if (checking.current) return;
    checking.current = true;
    setStatus({ kind: 'checking' });
    try {
      await verifyCode(email, digits);
    } catch (e) {
      setStatus({
        kind: 'failed',
        message:
          e instanceof WrongCodeError
            ? 'That code didn’t work. Check it’s from the newest email, or send a new code.'
            : e instanceof TooManyTriesError
              ? 'Too many tries for now. Wait a few minutes, then send a new code.'
              : 'Tare couldn’t check the code. Check you’re online, then try again.',
      });
    } finally {
      checking.current = false;
    }
  }

  // Digits only, so a pasted "1234 5678" or "Your code: 12345678" works. Checks itself once
  // the code is complete.
  function change(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, SIGN_IN_CODE_LENGTH);
    if (digits === code) return;
    setCode(digits);
    if (status.kind === 'failed' || status.kind === 'resent') setStatus({ kind: 'typing' });
    if (digits.length === SIGN_IN_CODE_LENGTH) void check(digits);
  }

  async function resend() {
    setStatus({ kind: 'resending' });
    setCode('');
    try {
      await sendCode(email);
      setStatus({ kind: 'resent' });
    } catch (e) {
      setStatus({ kind: 'failed', message: sendFailure(e) });
    }
  }

  return (
    <section className={s['stack']} aria-labelledby="code-title">
      <StatusHero
        icon={<Icon name="check" size={28} />}
        tone="accent"
        title={<span id="code-title">Enter the code from your email</span>}
      >
        We sent a {SIGN_IN_CODE_LENGTH}-digit code to{' '}
        <strong className={s['breakAll']}>{email}</strong>. It works for 10 minutes.
      </StatusHero>
      <form
        className={s['stack']}
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === SIGN_IN_CODE_LENGTH) void check(code);
        }}
      >
        <TextField
          label="Code"
          variant="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          enterKeyHint="go"
          autoFocus
          placeholder={'0'.repeat(SIGN_IN_CODE_LENGTH)}
          value={code}
          onChange={change}
          disabled={busy}
          error={status.kind === 'failed' ? status.message : null}
        />
        <Button
          type="submit"
          size={60}
          fullWidth
          disabled={busy || code.length !== SIGN_IN_CODE_LENGTH}
        >
          {status.kind === 'checking' ? 'Checking your code…' : 'Sign in'}
        </Button>
      </form>
      <p aria-live="polite" className={s['lede']}>
        {status.kind === 'resent' ? 'We sent a new code. Use the newest one.' : ''}
      </p>
      <div className={s['row']}>
        <TextLink onClick={() => void resend()}>
          {status.kind === 'resending' ? 'Sending…' : 'Send a new code'}
        </TextLink>
        <TextLink onClick={onRestart}>Use a different email</TextLink>
      </div>
      <p className={s['lede']}>On a computer, the link in the email works too.</p>
    </section>
  );
}
