import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './TextField.module.css';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'size'
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Help under the field. */
  hint?: ReactNode;
  /** An error under the field; marks the field invalid. */
  error?: ReactNode;
  /** `code`: large, centred mono digits (sign-in codes). */
  variant?: 'default' | 'code';
}

/** A labelled text input. */
export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  variant = 'default',
  id,
  className,
  ...rest
}: TextFieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  return (
    <div className={cx(styles['field'], className)}>
      <label htmlFor={inputId} className={styles['label']}>
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cx(
          styles['input'],
          variant === 'code' && styles['code'],
          error ? styles['invalid'] : null,
        )}
      />
      {hint ? (
        <p id={hintId} className={styles['hint']}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className={styles['error']}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
