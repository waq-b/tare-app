import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  label: ReactNode;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** `row`: a 48px line. `tile`: a bordered tile for 2-column grids (kit). */
  variant?: 'row' | 'tile';
  disabled?: boolean;
}

export function Checkbox({
  label,
  checked,
  onChange,
  variant = 'row',
  disabled = false,
}: CheckboxProps) {
  return (
    <label
      className={cx(
        styles['box'],
        styles[variant],
        checked && styles['checked'],
        disabled && styles['disabled'],
      )}
    >
      <input
        type="checkbox"
        className={styles['input']}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
