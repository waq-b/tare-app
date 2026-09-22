import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './SegmentedControl.module.css';

export interface SegmentOption<V extends string> {
  value: V;
  label: ReactNode;
}

export interface SegmentedControlProps<V extends string> {
  /** Group name, read by screen readers ("Days per week"). */
  label: string;
  options: readonly SegmentOption<V>[];
  value: V | null;
  onChange?: (value: V) => void;
  /** `accent` (lime selection) or `neutral` (text border, surface-3). */
  tone?: 'accent' | 'neutral';
  /** `compact`: mono labels in a tight track (range pickers, chart/table). */
  size?: 'md' | 'compact';
}

/** Single choice from a few options: a radio group with arrow-key navigation. */
export function SegmentedControl<V extends string>({
  label,
  options,
  value,
  onChange,
  tone = 'accent',
  size = 'md',
}: SegmentedControlProps<V>) {
  const ref = useRef<HTMLDivElement>(null);
  const index = options.findIndex((o) => o.value === value);

  const move = (e: KeyboardEvent) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (!step) return;
    e.preventDefault();
    const next = options[(Math.max(index, 0) + step + options.length) % options.length];
    if (!next) return;
    onChange?.(next.value);
    const i = options.indexOf(next);
    ref.current?.querySelectorAll<HTMLElement>('[role="radio"]')[i]?.focus();
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className={cx(styles['group'], styles[size])}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      onKeyDown={move}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (index < 0 && i === 0) ? 0 : -1}
            onClick={() => onChange?.(o.value)}
            className={cx(styles['seg'], on && styles[`on-${tone}`])}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
