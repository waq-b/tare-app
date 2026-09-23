// Runs sync in the background: at start, when the phone comes back online, when the app
// comes back to the front, and every few minutes; after a failure it retries with backoff.
// Screens read the status from Dexie (useSyncStatus) and can ask for a pass (useSyncNow).
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useAppData } from '../data/DbContext.tsx';
import { readStatus, STATUS_KEY, syncOnce, type SyncStatus } from './engine.ts';
import type { SyncTransport } from './transport.ts';

const EVERY_MS = 5 * 60_000;
const BACKOFF_MS = [30_000, 60_000, 120_000, 300_000];

const Ctx = createContext<(() => void) | null>(null);

export function SyncProvider({
  transport,
  children,
}: {
  transport: SyncTransport;
  children: ReactNode;
}) {
  const { db } = useAppData();

  const scheduler = useMemo(() => {
    let running: Promise<unknown> | null = null;
    let again = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let stopped = false;

    const schedule = (ms: number) => {
      clearTimeout(timer);
      if (!stopped) timer = setTimeout(run, ms);
    };
    function run() {
      if (running) {
        again = true;
        return;
      }
      running = syncOnce(db, transport).then((s) => {
        running = null;
        const ok = s.state === 'idle';
        failures = ok ? 0 : failures + 1;
        if (again) {
          again = false;
          run();
        } else {
          schedule(ok || s.state === 'offline' ? EVERY_MS : (BACKOFF_MS[failures - 1] ?? EVERY_MS));
        }
      });
    }
    return {
      run,
      stop: () => {
        stopped = true;
        clearTimeout(timer);
      },
    };
  }, [db, transport]);

  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && scheduler.run();
    window.addEventListener('online', scheduler.run);
    document.addEventListener('visibilitychange', onVisible);
    scheduler.run();
    return () => {
      scheduler.stop();
      window.removeEventListener('online', scheduler.run);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [scheduler]);

  return <Ctx.Provider value={scheduler.run}>{children}</Ctx.Provider>;
}

/** Ask for a sync pass now (a no-op where sync isn't running, e.g. in tests). */
export function useSyncNow(): () => void {
  return useContext(Ctx) ?? noop;
}
const noop = () => {};

/** The last saved sync status, with the live outbox count. */
export function useSyncStatus(): SyncStatus | undefined {
  const { db } = useAppData();
  return useLiveQuery(async () => {
    const s = await readStatus(db);
    return { ...s, pending: await db.outbox.count() };
  }, [db]);
}

export { STATUS_KEY };
