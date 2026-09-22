import { Icon } from '@tare/icons';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './TextLink.module.css';

export interface TextLinkProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Trailing chevron for "go somewhere" links. */
  chevron?: boolean;
  /** Opens outside the app (e.g. an NHS page). Adds an external icon and a hint. */
  external?: boolean;
  className?: string;
}

export function TextLink({
  children,
  href,
  onClick,
  chevron = false,
  external = false,
  className,
}: TextLinkProps) {
  const inner = (
    <>
      <span className={styles['text']}>{children}</span>
      {external ? (
        <>
          <Icon name="ext" size={16} />
          <span className="sr-only"> (opens outside Tare)</span>
        </>
      ) : null}
      {chevron ? <Icon name="chev-r" size={18} /> : null}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className={cx(styles['link'], className)}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cx(styles['link'], className)}>
      {inner}
    </button>
  );
}
