import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Card.module.css';

export interface CardProps {
  children: ReactNode;
  /** Makes the whole card a link. */
  href?: string;
  /** `raised` = elev.1 (default); `ground` = elev.0, for rows on the page. */
  level?: 'raised' | 'ground';
  padding?: 'none' | 'md';
  className?: string;
  'aria-label'?: string;
}

/** A surface-1 container with a hairline (elev.1). */
export function Card({
  children,
  href,
  level = 'raised',
  padding = 'md',
  className,
  ...aria
}: CardProps) {
  const cls = cx(
    styles['card'],
    styles[level],
    padding === 'md' && styles['pad'],
    href && styles['link'],
    className,
  );
  if (href) {
    return (
      <a href={href} className={cls} {...aria}>
        {children}
      </a>
    );
  }
  return (
    <div className={cls} {...aria}>
      {children}
    </div>
  );
}
