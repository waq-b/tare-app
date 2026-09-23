// A calm full-screen wait: the wordmark and one line. Used while the app checks the server
// for your data on a new phone, and while an update installs.
import { MiniquestTag, Wordmark } from '@tare/ui';
import s from './shell.module.css';

export function Splash({ message }: { message: string }) {
  return (
    <main className={s['splash']} aria-busy="true" aria-live="polite">
      <Wordmark size={52} />
      <p className={s['splashText']}>{message}</p>
      <div className={s['splashTag']}>
        <MiniquestTag />
      </div>
    </main>
  );
}
