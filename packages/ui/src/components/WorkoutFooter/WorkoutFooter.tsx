import { Icon } from '@tare/icons';
import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import styles from './WorkoutFooter.module.css';

export interface WorkoutFooterProps {
  /** "Done", or "Finish workout" after the last set. */
  actionLabel: string;
  /** Mono value after the label, e.g. "62.5 × 6". */
  actionValue?: string;
  onAction?: () => void;
  /** Next exercise, e.g. { name: "Lat pulldown", rx: "3 × 12 @ 47.5" }. */
  next?: { name: string; rx: string };
  /** Docked rest timer, shown above the action. */
  docked?: ReactNode;
}

/** The sticky bottom of the Ledger: the one big action lives in the thumb zone. */
export function WorkoutFooter({
  actionLabel,
  actionValue,
  onAction,
  next,
  docked,
}: WorkoutFooterProps) {
  return (
    <div className={styles['footer']}>
      {docked}
      <Button
        size={64}
        fullWidth
        icon={<Icon name="check" size={22} />}
        {...(actionValue ? { value: actionValue } : {})}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
      {next ? (
        <p className={styles['next']}>
          <span>Next: {next.name}</span>
          <span className={styles['rx']}>{next.rx}</span>
        </p>
      ) : null}
    </div>
  );
}
