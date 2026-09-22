import { Icon, type IconName } from '@tare/icons';
import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './IconButton.module.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Accessible name. Required: the button has no visible text. */
  label: string;
  variant?: 'ghost' | 'outlined';
  /** Unread dot (e.g. notifications). Add "1 new" to `label` too. */
  badge?: boolean;
  /** Render as a link instead of a button. */
  href?: string;
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  badge = false,
  href,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const cls = cx(styles['btn'], styles[variant], className);
  const inner = (
    <>
      <Icon name={icon} size={22} />
      {badge ? <span className={styles['badge']} /> : null}
    </>
  );
  if (href) {
    return (
      <a href={href} aria-label={label} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} aria-label={label} className={cls} {...rest}>
      {inner}
    </button>
  );
}
