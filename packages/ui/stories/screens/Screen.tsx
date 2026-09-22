// Story-only frame for full screens: a 390×844 phone, with room for sheets.
import type { ReactNode } from 'react';
import s from './screen.module.css';

export function ScreenFrame({ children }: { children: ReactNode }) {
  return <div className={s['frame']}>{children}</div>;
}

/** The scrolling middle of a screen. */
export function ScreenBody({ children, gap = 16 }: { children: ReactNode; gap?: number }) {
  return (
    <main className={s['body']} style={{ gap }}>
      {children}
    </main>
  );
}
