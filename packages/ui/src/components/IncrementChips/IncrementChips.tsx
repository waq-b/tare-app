import { num } from '../../lib/format';
import styles from './IncrementChips.module.css';

export interface IncrementChipsProps {
  /** Deltas to offer, e.g. from pr.* increments for this lift. Passed in, never hard-coded. */
  deltas: readonly number[];
  unit?: string;
  onApply?: (delta: number) => void;
}

/** Quick load changes: −5, −2.5, +2.5, +5. */
export function IncrementChips({ deltas, unit = 'kg', onApply }: IncrementChipsProps) {
  return (
    <div className={styles['chips']} role="group" aria-label="Quick changes">
      {deltas.map((d) => {
        const text = `${d > 0 ? '+' : '−'}${num(Math.abs(d))}`;
        return (
          <button
            key={d}
            type="button"
            className={styles['chip']}
            onClick={() => onApply?.(d)}
            aria-label={`${text} ${unit}`}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
