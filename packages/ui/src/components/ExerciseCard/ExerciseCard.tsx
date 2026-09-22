import { PatternIcon, type MovementPattern } from '@tare/icons';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { IconTile } from '../IconTile/IconTile';
import { Skeleton } from '../Skeleton/Skeleton';
import styles from './ExerciseCard.module.css';

export interface ExerciseCardProps {
  name: string;
  pattern: MovementPattern;
  /** "Warm-up sets included", "Per hand". */
  subline?: ReactNode;
  /** A <Prescription>. */
  prescription: ReactNode;
  /** A <DiffChip> when the plan changed this week. */
  diff?: ReactNode;
  href?: string;
  /** `row` in session lists (64px), `card` standalone. */
  layout?: 'row' | 'card';
}

/** One planned exercise: pattern tile, name, prescription. */
export function ExerciseCard({
  name,
  pattern,
  subline,
  prescription,
  diff,
  href,
  layout = 'row',
}: ExerciseCardProps) {
  const body = (
    <>
      <IconTile size={40}>
        <PatternIcon pattern={pattern} size={22} />
      </IconTile>
      <span className={styles['text']}>
        <span className={styles['name']}>
          {name}
          {diff}
        </span>
        {subline != null ? <span className={styles['sub']}>{subline}</span> : null}
      </span>
      {prescription}
    </>
  );
  const cls = cx(styles['item'], styles[layout]);
  return href ? (
    <a href={href} className={cls}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Placeholder row while the session loads. */
export function ExerciseCardSkeleton() {
  return (
    <div className={cx(styles['item'], styles['row'])} aria-hidden="true">
      <Skeleton shape="tile" />
      <span className={styles['text']}>
        <Skeleton width="60%" />
        <Skeleton width="30%" height={10} />
      </span>
      <Skeleton width={72} />
    </div>
  );
}
