import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './RadioCard.module.css';

export interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange?: (value: string) => void;
  title: ReactNode;
  hint?: ReactNode;
}

/** A radio option with a title and hint. Group several inside a <fieldset> with a legend. */
export function RadioCard({ name, value, checked, onChange, title, hint }: RadioCardProps) {
  return (
    <label className={cx(styles['card'], checked && styles['checked'])}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange?.(value)}
        className={styles['input']}
      />
      <span className={styles['text']}>
        <span className={styles['title']}>{title}</span>
        {hint != null ? <span className={styles['hint']}>{hint}</span> : null}
      </span>
    </label>
  );
}
