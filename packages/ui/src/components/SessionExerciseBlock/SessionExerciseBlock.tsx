import { conventionSuffix, loadText, type LoadConvention } from '../../lib/format';
import { Tag } from '../Tag/Tag';
import styles from './SessionExerciseBlock.module.css';

export interface SetPillData {
  load: number | null;
  reps: number;
}

/** One logged set as "62.5 × 6". */
export function SetPill({
  load,
  reps,
  loadConvention,
}: SetPillData & { loadConvention?: LoadConvention }) {
  return (
    <span className={styles['pill']}>
      {loadConvention === 'bodyweight' || load == null
        ? `${reps}`
        : `${loadText(load, loadConvention)} × ${reps}`}
    </span>
  );
}

export interface SessionExerciseBlockProps {
  name: string;
  sets: readonly SetPillData[];
  loadConvention?: LoadConvention;
  /** Hardest effort tapped, e.g. "Hard". */
  effort?: string;
  pr?: boolean;
}

/** An exercise in a past session: name, PR tag, effort, and its working sets. */
export function SessionExerciseBlock({
  name,
  sets,
  loadConvention,
  effort,
  pr = false,
}: SessionExerciseBlockProps) {
  const suffix = conventionSuffix(loadConvention);
  return (
    <section className={styles['block']}>
      <div className={styles['head']}>
        <h3 className={styles['name']}>{name}</h3>
        {pr ? <Tag tone="accent">PR</Tag> : null}
        {effort ? <span className={styles['effort']}>{effort}</span> : null}
      </div>
      <div className={styles['sets']}>
        {sets.map((s, i) => (
          <SetPill key={i} {...s} {...(loadConvention ? { loadConvention } : {})} />
        ))}
        {suffix ? <span className={styles['suffix']}>{suffix}</span> : null}
      </div>
    </section>
  );
}
