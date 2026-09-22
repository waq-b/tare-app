import styles from './MealRow.module.css';

export interface MealRowProps {
  name: string;
  /** "Porridge, banana, coffee", or null when nothing is logged yet. */
  items: string | null;
  kcal: number | null;
  proteinG: number | null;
}

/** One meal from the imported food log. Not logged shows "—", never a guess. */
export function MealRow({ name, items, kcal, proteinG }: MealRowProps) {
  const logged = kcal != null;
  return (
    <div className={styles['row']}>
      <div className={styles['text']}>
        <span className={styles['name']}>{name}</span>
        <span className={styles['items']}>{items ?? 'Not logged yet'}</span>
      </div>
      <div className={styles['nums']}>
        <span>{logged ? `${kcal} kcal` : '—'}</span>
        <span className={styles['protein']}>{proteinG != null ? `${proteinG} g protein` : ''}</span>
      </div>
    </div>
  );
}
