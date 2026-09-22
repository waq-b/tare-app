import { cx } from '../../lib/cx';
import styles from './Prescription.module.css';

export interface PrescriptionProps {
  /** "3 × 8 @ 70" (use rxText). */
  rx: string;
  /** When the plan changed: the old prescription, shown struck through. */
  from?: string;
  /** Colour of the new value when changed. */
  tone?: 'progress' | 'deload' | 'swap' | 'hold';
}

/** Mono "sets × reps @ load", optionally showing a change. */
export function Prescription({ rx, from, tone = 'progress' }: PrescriptionProps) {
  if (!from) return <span className={styles['rx']}>{rx}</span>;
  return (
    <span className={styles['rx']}>
      <span className="sr-only">Changed from </span>
      <s className={styles['from']}>{from}</s>
      <span className="sr-only"> to </span>
      <span className={cx(styles['to'], styles[tone])}>{rx}</span>
    </span>
  );
}
