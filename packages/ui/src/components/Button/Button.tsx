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
  | 'emergency'
  | 'emergency-outline';

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
  /** Render as a link (e.g. `tel:999`, an NHS page). */
  href?: string;
  /** For links that leave the app. Opens a new tab and says so to screen readers. */
  external?: boolean;
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
  href,
  external = false,
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
  const inner = (
    <>
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
      {external ? <span className="sr-only"> (opens outside Tare)</span> : null}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className={cls}
        aria-label={rest['aria-label']}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {inner}
    </button>
  );
}
