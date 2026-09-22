import { Icon } from '@tare/icons';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './ListRow.module.css';

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-hand value, e.g. "7 items" or "Sun 20 Sep, 19:02". */
  value?: ReactNode;
  valueMono?: boolean;
  valueTone?: 'default' | 'progress' | 'warning';
  /** Leading icon or IconTile. */
  leading?: ReactNode;
  /** Extra trailing content before the chevron, e.g. a Tag. */
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** `default` 56px · `option` 72px choice card · `compact` 44px surface row (not interactive). */
  variant?: 'default' | 'option' | 'compact';
  disabled?: boolean;
}

/** One row for settings, history, options and key–value pairs. Rows with `href` or
 * `onClick` are links/buttons with a chevron; rows without are plain text. */
export function ListRow({
  title,
  subtitle,
  value,
  valueMono = false,
  valueTone = 'default',
  leading,
  trailing,
  href,
  onClick,
  variant = 'default',
  disabled = false,
}: ListRowProps) {
  const interactive = Boolean(href || onClick) && !disabled;
  const body = (
    <>
      {leading ? <span className={styles['leading']}>{leading}</span> : null}
      <span className={styles['text']}>
        <span className={styles['title']}>{title}</span>
        {subtitle != null ? <span className={styles['subtitle']}>{subtitle}</span> : null}
      </span>
      {value != null ? (
        <span className={cx(styles['value'], valueMono && styles['mono'], styles[valueTone])}>
          {value}
        </span>
      ) : null}
      {trailing}
      {interactive ? <Icon name="chev-r" size={20} /> : null}
    </>
  );
  const cls = cx(
    styles['row'],
    styles[variant],
    interactive && styles['interactive'],
    disabled && styles['disabled'],
  );
  if (href && !disabled) {
    return (
      <a href={href} className={cls}>
        {body}
      </a>
    );
  }
  if (onClick && !disabled) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  }
  return (
    <div className={cls} {...(disabled ? { 'aria-disabled': true } : {})}>
      {body}
    </div>
  );
}
