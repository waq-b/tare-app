import { Icon, PatternIcon, type MovementPattern } from '@tare/icons';
import type { ReactNode } from 'react';
import { IconTile } from '../IconTile/IconTile';
import styles from './ExerciseHeader.module.css';

export interface ExerciseHeaderProps {
  name: string;
  /** Muscles line, e.g. "Chest · shoulders · triceps" (from exercises.json). */
  muscles?: ReactNode;
  pattern: MovementPattern;
  /** Larger title and tile on the exercise detail page. */
  size?: 'workout' | 'detail';
  swapHref?: string;
  onSwap?: () => void;
  headingLevel?: 1 | 2;
}

export function ExerciseHeader({
  name,
  muscles,
  pattern,
  size = 'workout',
  swapHref,
  onSwap,
  headingLevel = 1,
}: ExerciseHeaderProps) {
  const H = headingLevel === 1 ? 'h1' : 'h2';
  const swap = (
    <>
      <Icon name="swap" size={18} />
      Swap
      <span className="sr-only"> {name}</span>
    </>
  );
  return (
    <div className={styles['head']}>
      <IconTile size={size === 'detail' ? 56 : 48}>
        <PatternIcon pattern={pattern} size={size === 'detail' ? 30 : 26} />
      </IconTile>
      <div className={styles['text']}>
        <H className={styles['name']}>{name}</H>
        {muscles != null ? <p className={styles['muscles']}>{muscles}</p> : null}
      </div>
      {swapHref ? (
        <a href={swapHref} className={styles['swap']}>
          {swap}
        </a>
      ) : onSwap ? (
        <button type="button" onClick={onSwap} className={styles['swap']}>
          {swap}
        </button>
      ) : null}
    </div>
  );
}
