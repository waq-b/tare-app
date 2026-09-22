import styles from './ComparisonRow.module.css';

export interface ComparisonRowProps {
  name: string;
  /** "60 × 10" */
  before: string;
  /** "62.5 × 6" */
  after: string;
  /** "+2.5 kg", "+1 rep". */
  delta: string;
}

/** "Beat last time" line on Finish. */
export function ComparisonRow({ name, before, after, delta }: ComparisonRowProps) {
  return (
    <div className={styles['row']}>
      <span className={styles['name']}>{name}</span>
      <span className={styles['figs']}>
        {before}
        <span aria-hidden="true"> → </span>
        <span className="sr-only"> to </span>
        {after}
      </span>
      <span className={styles['delta']}>{delta}</span>
    </div>
  );
}
