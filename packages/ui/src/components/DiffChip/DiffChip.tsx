import { Icon } from '@tare/icons';
import { cx } from '../../lib/cx';
import styles from './DiffChip.module.css';

export interface DiffChipProps {
  /** The old value, struck through. Omit for a compact "+2.5" chip. */
  from?: string;
  to: string;
  tone?: 'progress' | 'hold' | 'swap' | 'deload';
  size?: 'compact' | 'large';
}

/** A change, before → after. Colour says what kind; the words say what changed. */
export function DiffChip({ from, to, tone = 'progress', size = 'large' }: DiffChipProps) {
  return (
    <span className={cx(styles['chip'], styles[tone], styles[size])}>
      {from ? (
        <>
          <span className="sr-only">Changed from </span>
          <s className={styles['from']}>{from}</s>
          <Icon name="chev-r" size={size === 'compact' ? 14 : 16} />
          <span className="sr-only"> to </span>
        </>
      ) : (
        <Icon name="up" size={14} />
      )}
      <span className={styles['to']}>{to}</span>
    </span>
  );
}
