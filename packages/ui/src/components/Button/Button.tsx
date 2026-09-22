import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'secondary-outline'
  | 'ghost'
  | 'hold'
  | 'swap'
  | 'deload'
  | 'warning'
  | 'emergency';

/** 64 = screen CTA, 60 = default, 52 = compact, 44 = inline. */
export type ButtonSize = 64 | 60 | 52 | 44;

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'value'
> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon, e.g. `<Icon name="phone" />`. Decorative; the label names the action. */
  icon?: ReactNode;
  /** Trailing numbers in mono, e.g. "70 × 8" in "Done · 70 × 8". */
  value?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 60,
  icon,
  value,
  fullWidth = false,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const cls = [
    styles['button'],
    styles[variant],
    styles[`s${size}`],
    fullWidth ? styles['full'] : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {icon ? <span className={styles['icon']}>{icon}</span> : null}
      <span>{children}</span>
      {value != null ? (
        <>
          <span aria-hidden="true" className={styles['sep']}>
            ·
          </span>
          <span className={styles['value']}>{value}</span>
        </>
      ) : null}
    </button>
  );
}
