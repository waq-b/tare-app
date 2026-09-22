import type { CSSProperties } from 'react';
import { cx } from '../../lib/cx';
import styles from './Legend.module.css';

export interface LegendItem {
  label: string;
  /** A CSS colour token, e.g. "var(--accent)". */
  color: string;
  mark?: 'box' | 'dot' | 'line' | 'dashed';
}

/** Key for a chart or map. Direct labels are preferred; use this when they don't fit. */
export function Legend({ items, label = 'Key' }: { items: readonly LegendItem[]; label?: string }) {
  return (
    <ul className={styles['legend']} aria-label={label}>
      {items.map((it) => (
        <li key={it.label}>
          <span
            aria-hidden="true"
            className={cx(styles['mark'], styles[it.mark ?? 'box'])}
            style={{ '--c': it.color } as CSSProperties}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

/** The same component, named for charts (DESIGN.md §3.6). */
export const ChartLegend = Legend;
