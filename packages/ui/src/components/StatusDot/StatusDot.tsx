import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './StatusDot.module.css';

export interface StatusDotProps {
  /** The status in words. Always shown: colour is never the only signal. */
  children: ReactNode;
  tone?: 'progress' | 'warning' | 'safety' | 'neutral';
}

export function StatusDot({ children, tone = 'neutral' }: StatusDotProps) {
  return (
    <span className={styles['wrap']}>
      <span aria-hidden="true" className={cx(styles['dot'], styles[tone])} />
      {children}
    </span>
  );
}
