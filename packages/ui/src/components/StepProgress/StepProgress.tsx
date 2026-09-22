import { cx } from '../../lib/cx';
import styles from './StepProgress.module.css';

export interface StepProgressProps {
  total: number;
  /** Completed steps. */
  done: number;
  /** Index (0-based) of the current step, shown half-strength. Defaults to `done`. */
  current?: number;
  /** `accent` for onboarding and weeks; `text` for "exercise N of M" in a workout. */
  tone?: 'accent' | 'text';
  /** e.g. "Step 2 of 5", "Exercise 1 of 6". */
  label: string;
  /** Optional labels under each segment (e.g. "Wk 1" … "Wk 4"). */
  labels?: string[];
}

export function StepProgress({
  total,
  done,
  current = done,
  tone = 'accent',
  label,
  labels,
}: StepProgressProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className={styles['wrap']}
    >
      <div className={styles['bars']}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cx(
              styles['seg'],
              styles[tone],
              i < done ? styles['done'] : i === current ? styles['current'] : undefined,
            )}
          />
        ))}
      </div>
      {labels ? (
        <div className={styles['labels']} aria-hidden="true">
          {labels.map((l, i) => (
            <span key={l} className={i === current ? styles['labelCurrent'] : undefined}>
              {l}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
