import { cx } from '../../lib/cx';
import styles from './EvidenceBadge.module.css';

const LEVEL: Record<string, number> = { weak: 1, moderate: 2, strong: 3 };

/** How strong the evidence behind a rule is, from its `evidence_strength`. Undefined means
 * the data gives none (e.g. a documented conflict), and the badge says so. */
export function EvidenceBadge({ strength }: { strength: string | undefined }) {
  const n = strength ? (LEVEL[strength] ?? 0) : 0;
  const label = strength
    ? `${strength.charAt(0).toUpperCase()}${strength.slice(1)} evidence`
    : 'No evidence rating';
  return (
    <span className={styles['badge']}>
      <span className={styles['bars']} aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cx(styles['bar'], i <= n && styles['on'])}
            style={{ height: 4 + i * 3 }}
          />
        ))}
      </span>
      {label}
    </span>
  );
}
