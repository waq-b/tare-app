import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Charts.module.css';

export interface HeroNumberProps {
  /** "Bench press e1RM" */
  label: string;
  value: string;
  unit?: string;
  /** "+8.0 since 28 Jul" */
  delta?: string;
  deltaTone?: 'progress' | 'neutral';
  /** "Estimated" or "Imported": estimates are labelled as estimates. */
  qualifier?: string;
}

/** A headline number. Not a chart: one value, clearly labelled. */
export function HeroNumber({
  label,
  value,
  unit,
  delta,
  deltaTone = 'neutral',
  qualifier,
}: HeroNumberProps) {
  return (
    <div className={styles['hero']}>
      <span className={styles['heroLabel']}>
        {label}
        {qualifier ? <span className={styles['qualifier']}> · {qualifier}</span> : null}
      </span>
      <span className={styles['heroValue']}>
        {value}
        {unit ? <span className={styles['unit']}> {unit}</span> : null}
      </span>
      {delta ? (
        <span className={cx(styles['delta'], deltaTone === 'progress' && styles['up'])}>
          {delta}
        </span>
      ) : null}
    </div>
  );
}

export interface StatTileProps {
  label: string;
  value: ReactNode;
  unit?: string;
  caption?: ReactNode;
  captionTone?: 'progress' | 'neutral';
}

/** A labelled number in a tile (Finish, Body, Food). */
export function StatTile({ label, value, unit, caption, captionTone = 'neutral' }: StatTileProps) {
  return (
    <div className={styles['tile']}>
      <span className={styles['tileLabel']}>{label}</span>
      <span className={styles['tileValue']}>
        {value}
        {unit ? <span className={styles['unit']}> {unit}</span> : null}
      </span>
      {caption != null ? (
        <span className={cx(styles['tileCaption'], captionTone === 'progress' && styles['up'])}>
          {caption}
        </span>
      ) : null}
    </div>
  );
}
