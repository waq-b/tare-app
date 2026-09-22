import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { IconTile } from '../IconTile/IconTile';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** Buttons or links, stacked. */
  actions?: ReactNode;
  /** Extra content between the text and the actions (progress, lists, options). */
  extra?: ReactNode;
  /** `centred` (default, in a card) or `left` (screen-level, with options). */
  layout?: 'centred' | 'left';
}

/** Honest "nothing here yet" states: never a fake chart or a guess. */
export function EmptyState({
  icon,
  title,
  children,
  actions,
  extra,
  layout = 'centred',
}: EmptyStateProps) {
  return (
    <div className={cx(styles['empty'], styles[layout])}>
      <IconTile size={layout === 'centred' ? 72 : 64} dashed>
        {icon}
      </IconTile>
      <div className={styles['text']}>
        <h2 className={styles['title']}>{title}</h2>
        {children != null ? <div className={styles['body']}>{children}</div> : null}
      </div>
      {extra}
      {actions ? <div className={styles['actions']}>{actions}</div> : null}
    </div>
  );
}
