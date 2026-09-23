// The app's one database, handed to screens through context so tests can pass their own.
import { createContext, useContext, type ReactNode } from 'react';
import { repos, Store, TareDb, type Repos } from '../db/index.ts';

export interface AppData {
  db: TareDb;
  store: Store;
  r: Repos;
}

export function createAppData(db = new TareDb(), now?: () => number): AppData {
  const store = new Store(db, now);
  return { db, store, r: repos(store) };
}

const Ctx = createContext<AppData | null>(null);

export function DbProvider({ data, children }: { data: AppData; children: ReactNode }) {
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export function useAppData(): AppData {
  const d = useContext(Ctx);
  if (!d) throw new Error('useAppData outside <DbProvider>');
  return d;
}
