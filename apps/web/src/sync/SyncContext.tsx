// Runs sync in the background: at start, when the phone comes back online, when the app
// comes back to the front, and every few minutes; after a failure it retries with backoff.
// Screens read the status from Dexie (useSyncStatus) and can ask for a pass (useSyncNow).
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useAppData } from '../data/DbContext.tsx';
import { readStatus, STATUS_KEY, syncOnce, type SyncStatus } from './engine.ts';
import type { SyncTransport } from './transport.ts';

const EVERY_MS = 5 * 60_000;
/** After a change on the phone, sync this soon (a burst of changes is sent together). */
const AFTER_CHANGE_MS = 3_000;
const BACKOFF_MS = [30_000, 60_000, 120_000, 300_000];

interface SyncApi {
  /** Ask for a pass soon. */
  run: () => void;
  /** Run a pass now and wait for it. */
  now: () => Promise<SyncStatus>;
}
const Ctx = createContext<SyncApi | null>(null);

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
    async function now(): Promise<SyncStatus> {
      while (running) await running;
      running = syncOnce(db, transport);
      const status = (await running) as SyncStatus;
      running = null;
      return status;
    }
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
      now,
      soon: () => schedule(AFTER_CHANGE_MS),
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

  // Send changes a few seconds after they're made, not only on the 5-minute pass (an installed
  // app's timers can be paused in the background, so waiting risks missing the window).
  const pending = useLiveQuery(() => db.outbox.count(), [db]);
  useEffect(() => {
    if (pending) scheduler.soon();
  }, [pending, scheduler]);

  const api = useMemo(() => ({ run: scheduler.run, now: scheduler.now }), [scheduler]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** Ask for a sync pass now (a no-op where sync isn't running, e.g. in tests). */
export function useSyncNow(): () => void {
  return useContext(Ctx)?.run ?? noop;
}

/** An awaitable pass, or null where sync isn't running (tests, e2e without an API). */
export function useSyncPass(): (() => Promise<SyncStatus>) | null {
  return useContext(Ctx)?.now ?? null;
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
