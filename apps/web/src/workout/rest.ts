// The rest timer runs on wall-clock time: the end moment is saved, so it keeps counting while
// the screen is locked, the app is in the background, or the page reloads.
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useSyncExternalStore } from 'react';
import type { TareDb } from '../db/index.ts';
import { useAppData } from '../data/DbContext.tsx';

export interface Rest {
  workoutId: string;
  /** When rest ends, ms since epoch. */
  until: number;
  /** Target rest in seconds (tr.goal.*.rest_seconds via the plan). */
  total: number;
  /** The set the rest follows, for its effort tap. */
  setId: string;
}

const KEY = 'rest';

export const startRest = (db: TareDb, r: Rest) => db.meta.put({ key: KEY, value: r });
export const clearRest = (db: TareDb) => db.meta.delete(KEY);
export async function adjustRest(db: TareDb, deltaSec: number, now = Date.now()) {
  const cur = (await db.meta.get(KEY))?.value as Rest | undefined;
  if (cur) await startRest(db, { ...cur, until: Math.max(now, cur.until + deltaSec * 1000) });
}

/** The active rest and seconds left, ticking once a second. Vibrates once when it ends. */
export function useRest(workoutId: string | undefined) {
  const { db } = useAppData();
  const rest = useLiveQuery(async () => {
    const r = (await db.meta.get(KEY))?.value as Rest | undefined;
    return r && r.workoutId === workoutId ? r : null;
  }, [db, workoutId]);
  const now = useClock(250);
  const remaining = rest ? Math.max(0, Math.ceil((rest.until - now) / 1000)) : 0;
  const ended = Boolean(rest) && remaining === 0;

  useEffect(() => {
    if (!ended) return;
    navigator.vibrate?.([200, 100, 200]);
    void clearRest(db);
  }, [ended, db]);

  return { rest: rest ?? null, remaining };
}

const subscribers = new Map<number, (onChange: () => void) => () => void>();
/** One stable subscribe function per interval, so React doesn't resubscribe every render. */
function subscribeEvery(ms: number) {
  let sub = subscribers.get(ms);
  if (!sub) {
    sub = (onChange) => {
      const t = setInterval(onChange, ms);
      return () => clearInterval(t);
    };
    subscribers.set(ms, sub);
  }
  return sub;
}

/** The wall clock, re-rendering every `ms`. Read fresh each time, so it's never stale. */
export function useClock(ms = 1000): number {
  const tick = useSyncExternalStore(subscribeEvery(ms), () => Math.floor(Date.now() / ms));
  return tick * ms;
}
