import { Icon } from '@tare/icons';
import { useState, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import styles from './Charts.module.css';

export interface Column<R> {
  key: keyof R & string;
  label: string;
  /** Numbers: right-aligned, mono, tabular. */
  numeric?: boolean;
  /** The row header column. */
  rowHeader?: boolean;
  render?: (row: R) => ReactNode;
  sortable?: boolean;
  /** A tone per cell, e.g. deltas. */
  tone?: (row: R) => 'progress' | 'warning' | 'neutral';
}

export interface DataTableProps<R> {
  caption: string;
  columns: readonly Column<R>[];
  rows: readonly R[];
  /** Initially sorted column (descending). */
  sortBy?: keyof R & string;
}

/** The accessible version of every chart, and a table in its own right. */
export function DataTable<R extends Record<string, unknown>>({
  caption,
  columns,
  rows,
  sortBy,
}: DataTableProps<R>) {
  const [sort, setSort] = useState<{ key: string; desc: boolean } | null>(
    sortBy ? { key: sortBy, desc: true } : null,
  );
  const sorted = sort
    ? [...rows].sort((a, b) => {
        const av = a[sort.key] as number | string;
        const bv = b[sort.key] as number | string;
        return (av > bv ? 1 : av < bv ? -1 : 0) * (sort.desc ? -1 : 1);
      })
    : rows;
  return (
    <div className={styles['tableWrap']}>
      <table className={styles['table']}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={cx(c.numeric && styles['num'])}
                  aria-sort={active ? (sort?.desc ? 'descending' : 'ascending') : undefined}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      className={styles['sortBtn']}
                      onClick={() => setSort({ key: c.key, desc: active ? !sort?.desc : true })}
                    >
                      {c.label}
                      <Icon name="sort" size={14} />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => {
                const content = c.render ? c.render(r) : String(r[c.key] ?? '—');
                const cls = cx(c.numeric && styles['num'], c.tone && styles[`tone-${c.tone(r)}`]);
                return c.rowHeader ? (
                  <th key={c.key} scope="row" className={cls}>
                    {content}
                  </th>
                ) : (
                  <td key={c.key} className={cls}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface ChartFrameProps {
  title: string;
  /** e.g. "Estimated from sets of 10 reps or fewer". */
  note?: ReactNode;
  legend?: ReactNode;
  chart: ReactNode;
  table: ReactNode;
  /** Start on the table (e.g. when the user prefers tables). */
  initialView?: 'chart' | 'table';
}

/** Every chart has a table one tap away (Charts rule 04). */
export function ChartFrame({
  title,
  note,
  legend,
  chart,
  table,
  initialView = 'chart',
}: ChartFrameProps) {
  const [view, setView] = useState<'chart' | 'table'>(initialView);
  return (
    <section className={styles['frame']} aria-label={title}>
      <div className={styles['frameHead']}>
        <h3 className={styles['frameTitle']}>{title}</h3>
        <div className={styles['toggle']}>
          <SegmentedControl
            label={`${title}: view`}
            size="compact"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
          />
        </div>
      </div>
      {note ? <p className={styles['note']}>{note}</p> : null}
      {view === 'chart' ? (
        <>
          {chart}
          {legend}
        </>
      ) : (
        table
      )}
    </section>
  );
}
