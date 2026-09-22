import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { Tone } from '../Tag/Tag';
import styles from './IconTile.module.css';

export interface IconTileProps {
  /** An `<Icon>` or `<PatternIcon>`; decorative. */
  children: ReactNode;
  size?: 40 | 48 | 56 | 64 | 72;
  tone?: Tone | 'on-emergency';
  /** Dashed outline, for empty states. */
  dashed?: boolean;
}

/** A rounded square holding an icon (pattern tiles, status heroes, notifications). */
export function IconTile({ children, size = 48, tone = 'neutral', dashed = false }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(styles['tile'], styles[`s${size}`], styles[tone], dashed && styles['dashed'])}
    >
      {children}
    </span>
  );
}
