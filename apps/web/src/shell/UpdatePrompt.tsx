// "A new version is ready": the service worker waits until the user says so, so an update
// never lands mid-workout.
import { Banner, Button } from '@tare/ui';
import { useRegisterSW } from 'virtual:pwa-register/react';
import s from './shell.module.css';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className={s['update']}>
      <Banner
        tone="info"
        title="A new version of Tare is ready"
        action={
          <span style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button size={52} variant="secondary-outline" onClick={() => setNeedRefresh(false)}>
              Later
            </Button>
            <Button size={52} onClick={() => void updateServiceWorker(true)}>
              Update
            </Button>
          </span>
        }
      >
        Your logs are safe. Updating reloads the app.
      </Banner>
    </div>
  );
}
