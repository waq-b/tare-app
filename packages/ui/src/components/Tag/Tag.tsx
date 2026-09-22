import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Tag.module.css';

export type Tone =
  'neutral' | 'accent' | 'progress' | 'hold' | 'deload' | 'swap' | 'warning' | 'safety';

export interface TagProps {
  children: ReactNode;
  tone?: Tone;
  /** `tint` = tinted fill with on-tint text (default); `solid` = full colour (e.g. "Chosen"). */
  fill?: 'tint' | 'solid';
  icon?: ReactNode;
  className?: string;
}

/** A small label pill: effort tags, status pills, "PR", "Best match", cue chips. */
export function Tag({ children, tone = 'neutral', fill = 'tint', icon, className }: TagProps) {
  return (
    <span
      className={cx(styles['tag'], styles[tone], fill === 'solid' && styles['solid'], className)}
    >
      {icon}
      {children}
    </span>
  );
}
