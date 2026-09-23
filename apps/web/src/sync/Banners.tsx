// The D1 sync states: offline (logging still works), unsynced after a failure, and sign in
// again. Nothing is shown when everything's synced.
import { Banner, Button, InlineNote } from '@tare/ui';
import { useSyncNow, useSyncStatus } from './SyncContext.tsx';

const changes = (n: number) => `${n} change${n === 1 ? '' : 's'}`;

export function SyncBanner() {
  const status = useSyncStatus();
  const syncNow = useSyncNow();
  if (
    !status ||
    (status.pending === 0 && status.state !== 'signin' && status.state !== 'not_allowed')
  ) {
    return null;
  }
  if (status.state === 'offline') {
    return (
      <Banner tone="offline" title="Offline: logging still works">
        {changes(status.pending)} saved on this phone. They sync when you’re back online.
      </Banner>
    );
  }
  if (status.state === 'failed') {
    return (
      <Banner
        tone="unsynced"
        title={`${changes(status.pending)} haven’t synced`}
        action={
          <Button variant="secondary-outline" size={52} onClick={syncNow}>
            Retry
          </Button>
        }
      >
        They’re safe on this phone.
      </Banner>
    );
  }
  if (status.state === 'signin') {
    return (
      <Banner
        tone="unsynced"
        title="Sign in again to sync"
        action={
          <Button variant="secondary-outline" size={52} href="/sign-in">
            Sign in
          </Button>
        }
      >
        Your logs are safe on this phone. Sync paused when your sign-in expired.
      </Banner>
    );
  }
  if (status.state === 'not_allowed') {
    return (
      <Banner tone="info" title="Sync isn’t set up for this account">
        Your logs are safe on this phone.
      </Banner>
    );
  }
  return null;
}

/** "Synced · 19:42", or what's waiting (Finish). */
export function SyncNote() {
  const status = useSyncStatus();
  if (!status) return null;
  if (status.pending === 0 && status.lastSyncedAt) {
    const t = new Date(status.lastSyncedAt);
    const hhmm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    return <InlineNote kind="synced">Synced · {hhmm}</InlineNote>;
  }
  return <InlineNote>Saved on this phone. It syncs in the background.</InlineNote>;
}

/** In a workout: only the offline state (Offline-Workout board). */
export function OfflineBanner() {
  const status = useSyncStatus();
  if (status?.state !== 'offline' || status.pending === 0) return null;
  return (
    <Banner tone="offline" title="Offline: logging still works">
      {changes(status.pending)} saved on this phone. They sync when you’re back online.
    </Banner>
  );
}
