import styles from './LastTimeStrip.module.css';

export interface LastTimeStripProps {
  /** "67.5 × 8 · 8 · 8" */
  sets: string;
  /** "Tue 15 Sep" */
  date: string;
  /** Effort word, e.g. "OK". */
  effort?: string;
}

/** What you did last time, one glance before the first set. */
export function LastTimeStrip({ sets, date, effort }: LastTimeStripProps) {
  return (
    <p className={styles['strip']}>
      <span className={styles['label']}>Last time</span>
      <span className={styles['sets']}>{sets}</span>
      <span className={styles['meta']}>
        {date}
        {effort ? ` · ${effort}` : ''}
      </span>
    </p>
  );
}
