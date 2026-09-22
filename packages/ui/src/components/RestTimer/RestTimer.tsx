import { clock, clockWords } from '../../lib/format';
import { Button } from '../Button/Button';
import styles from './RestTimer.module.css';

export interface RestTimerProps {
  /** Seconds left. The app counts down and passes it in. */
  remaining: number;
  /** Target rest in seconds (from tr.goal.*.rest_seconds). */
  total: number;
  variant?: 'full' | 'docked';
  /** "set 3 · 62.5 × 6" */
  next?: string;
  onAdjust?: (deltaSeconds: number) => void;
  onSkip?: () => void;
  /** Step for −/+ (a UI constant). */
  step?: number;
}

const R = 95;
const C = 2 * Math.PI * R;

/** Rest between sets: a ring in a sheet (full) or a bar above Done (docked). */
export function RestTimer({
  remaining,
  total,
  variant = 'full',
  next,
  onAdjust,
  onSkip,
  step = 15,
}: RestTimerProps) {
  const frac = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  const label = `Rest, ${clockWords(remaining)} left of ${clockWords(total)}`;
  if (variant === 'docked') {
    return (
      <div className={styles['docked']}>
        <span className={styles['dockLabel']}>Rest</span>
        <span role="timer" aria-label={label} className={styles['dockClock']}>
          {clock(remaining)}
        </span>
        <span className={styles['track']} aria-hidden="true">
          <span className={styles['fill']} style={{ width: `${frac * 100}%` }} />
        </span>
        <Button variant="ghost" size={44} onClick={onSkip}>
          Skip
        </Button>
      </div>
    );
  }
  return (
    <div className={styles['full']}>
      <div className={styles['ring']}>
        <svg viewBox="0 0 200 200" width="200" height="200" aria-hidden="true">
          <circle cx="100" cy="100" r={R} className={styles['ringTrack']} />
          <circle
            cx="100"
            cy="100"
            r={R}
            className={styles['ringFill']}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className={styles['centre']}>
          <span role="timer" aria-label={label} className={styles['clock']}>
            {clock(remaining)}
          </span>
          <span className={styles['of']}>of {clock(total)}</span>
        </div>
      </div>
      {next ? <p className={styles['next']}>Next: {next}</p> : null}
      <div className={styles['actions']}>
        <Button
          variant="secondary"
          size={52}
          onClick={() => onAdjust?.(-step)}
          aria-label={`${step} seconds less`}
        >
          −{step}s
        </Button>
        <Button
          variant="secondary"
          size={52}
          onClick={() => onAdjust?.(step)}
          aria-label={`${step} seconds more`}
        >
          +{step}s
        </Button>
        <Button variant="secondary-outline" size={52} onClick={onSkip}>
          Skip
        </Button>
      </div>
    </div>
  );
}
