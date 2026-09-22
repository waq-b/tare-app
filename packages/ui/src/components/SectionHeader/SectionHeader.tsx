import type { ReactNode } from 'react';
import styles from './SectionHeader.module.css';

export interface SectionHeaderProps {
  title: ReactNode;
  /** Right-hand meta, e.g. "1 left to decide". */
  meta?: ReactNode;
  as?: 'h2' | 'h3';
}

/** Section heading (type.heading) with optional meta on the right. */
export function SectionHeader({ title, meta, as: As = 'h2' }: SectionHeaderProps) {
  return (
    <div className={styles['wrap']}>
      <As className={styles['title']}>{title}</As>
      {meta != null ? <span className={styles['meta']}>{meta}</span> : null}
    </div>
  );
}
