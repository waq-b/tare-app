import styles from './StepList.module.css';

/** Numbered how-to steps or cues (from exercises.json). */
export function StepList({ steps }: { steps: readonly string[] }) {
  return (
    <ol className={styles['list']}>
      {steps.map((s, i) => (
        <li key={i} className={styles['item']}>
          <span className={styles['n']} aria-hidden="true">
            {i + 1}
          </span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}
