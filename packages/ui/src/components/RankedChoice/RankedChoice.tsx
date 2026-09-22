import styles from './RankedChoice.module.css';

export interface RankedOption {
  value: string;
  label: string;
}

export interface RankedChoiceProps {
  /** Group name for screen readers. */
  label: string;
  options: readonly RankedOption[];
  /** Chosen values in order: first = primary. */
  ranking: readonly string[];
  /** How many can be ranked. */
  max?: number;
  onToggle?: (value: string) => void;
}

const ORD = ['1st', '2nd', '3rd', '4th'];

/** Tap options in order of importance. Tap again to remove. */
export function RankedChoice({ label, options, ranking, max = 2, onToggle }: RankedChoiceProps) {
  return (
    <div role="group" aria-label={label} className={styles['list']}>
      {options.map((o) => {
        const rank = ranking.indexOf(o.value);
        const on = rank >= 0;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={!on && ranking.length >= max}
            onClick={() => onToggle?.(o.value)}
            className={on ? `${styles['opt']} ${styles['on']}` : styles['opt']}
          >
            <span className={styles['label']}>{o.label}</span>
            {on ? <span className={styles['rank']}>{ORD[rank]}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
