import { PatternIcon, type MovementPattern } from '@tare/icons';
import { cx } from '../../lib/cx';
import { IconTile } from '../IconTile/IconTile';
import { Tag } from '../Tag/Tag';
import styles from './SwapRow.module.css';

export interface SwapRowProps {
  name: string;
  pattern: MovementPattern;
  /** Why it's a swap, in words (mapped from the vpt swap_reason). */
  reason?: string;
  /** Estimated starting load, e.g. "24 kg per hand", "BW". Always an estimate. */
  load?: string;
  /** 1-based rank (best first, as in exercises.json swaps). */
  rank?: number;
  best?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  href?: string;
}

/** A swap option. Ranked and selectable in the swap sheet; compact on exercise detail. */
export function SwapRow({
  name,
  pattern,
  reason,
  load,
  rank,
  best = false,
  selected = false,
  onSelect,
  href,
}: SwapRowProps) {
  const body = (
    <>
      {rank != null ? <span className={styles['rank']}>{rank}</span> : null}
      <IconTile size={40}>
        <PatternIcon pattern={pattern} size={22} />
      </IconTile>
      <span className={styles['text']}>
        <span className={styles['name']}>
          {name}
          {best ? <Tag tone="swap">Best match</Tag> : null}
        </span>
        {reason ? <span className={styles['reason']}>{reason}</span> : null}
      </span>
      {load ? (
        <span className={styles['load']}>
          <span className="sr-only">Start at about </span>
          {load}
        </span>
      ) : null}
    </>
  );
  const cls = cx(styles['row'], selected && styles['selected']);
  if (onSelect) {
    return (
      <button type="button" aria-pressed={selected} onClick={onSelect} className={cls}>
        {body}
      </button>
    );
  }
  return href ? (
    <a href={href} className={cls}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}
