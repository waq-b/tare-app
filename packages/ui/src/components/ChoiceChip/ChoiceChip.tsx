import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './ChoiceChip.module.css';

export interface ChoiceChipProps {
  children: ReactNode;
  selected: boolean;
  onToggle?: () => void;
  /** `outline` (default) or `filled` (surface-2 when unselected). */
  variant?: 'outline' | 'filled';
  /** `accent` selection (lime) or `neutral` (text-colour border). */
  tone?: 'neutral' | 'accent';
}

/** A toggle chip (aria-pressed). Use in a wrapping row for multi-select, e.g. body areas. */
export function ChoiceChip({
  children,
  selected,
  onToggle,
  variant = 'outline',
  tone = 'neutral',
}: ChoiceChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cx(styles['chip'], styles[variant], selected && styles[`on-${tone}`])}
    >
      {children}
    </button>
  );
}
