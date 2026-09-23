import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fakeAuthClient } from '../src/auth/fake.ts';
import { renderApp } from './render.tsx';

async function toCodeStep() {
  const auth = fakeAuthClient(null);
  const r = await renderApp('/', { account: null, auth });
  await waitFor(() => expect(r.router.state.location.pathname).toBe('/sign-in'));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' test@example.com ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Email me a code' }));
  await screen.findByText('Enter the code from your email');
  return { ...r, auth };
}

describe('sign-in (email code, like pip)', () => {
  it('sends the code to the trimmed address', async () => {
    const { auth } = await toCodeStep();
    expect(auth.sent).toEqual(['test@example.com']);
    expect(screen.getByLabelText('Code').getAttribute('autocomplete')).toBe('one-time-code');
    expect(screen.getByLabelText('Code').getAttribute('inputmode')).toBe('numeric');
  });

  it('a pasted code checks itself once, signs in, and remembers the account', async () => {
    const { router, data } = await toCodeStep();
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'Your code: 1111 1111' } });
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect((await data.db.meta.get('account'))?.value).toBe('test@example.com');
  });

  it('a wrong code says so, and typing again clears the message', async () => {
    const { auth } = await toCodeStep();
    auth.code = '22222222';
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '12345678' } });
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'That code didn’t work. Check it’s from the newest email, or send a new code.',
    );
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '1234567' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('too many tries, and too many emails, each get their own message', async () => {
    const { auth } = await toCodeStep();
    auth.failNextVerify = 'tries';
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '11111111' } });
    expect((await screen.findByRole('alert')).textContent).toMatch(/Too many tries/);
    auth.failNextSend = 'limit';
    fireEvent.click(screen.getByRole('button', { name: 'Send a new code' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/too many sign-in emails/);
  });

  it('can start again with a different email', async () => {
    await toCodeStep();
    fireEvent.click(screen.getByRole('button', { name: 'Use a different email' }));
    expect(await screen.findByRole('button', { name: 'Email me a code' })).toBeTruthy();
  });

  it('a remembered account opens the app with no session at all (offline start)', async () => {
    const auth = fakeAuthClient(null);
    auth.getSession = () => Promise.reject(new Error('offline'));
    const { router } = await renderApp('/plan', { account: 'test@example.com', auth });
    expect(await screen.findByText('No plan yet.')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/plan');
  });
});
