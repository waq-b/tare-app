import { Icon, type IconName } from '@tare/icons';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Banner.module.css';

export type BannerTone = 'offline' | 'info' | 'unsynced' | 'deload' | 'success' | 'pr' | 'safety';

const ICON: Record<BannerTone, IconName> = {
  offline: 'cloud-off',
  info: 'info',
  unsynced: 'alert',
  deload: 'moon',
  success: 'check',
  pr: 'trophy',
  safety: 'phone',
};

export interface BannerProps {
  tone: BannerTone;
  title: ReactNode;
  children?: ReactNode;
  /** Inline action, e.g. a Retry button. */
  action?: ReactNode;
  icon?: IconName;
}

/** A status message on a tint. Offline and info are neutral; others use their semantic colour. */
export function Banner({ tone, title, children, action, icon }: BannerProps) {
  return (
    <div role="status" className={cx(styles['banner'], styles[tone])}>
      <span className={styles['icon']}>
        <Icon name={icon ?? ICON[tone]} size={20} />
      </span>
      <div className={styles['body']}>
        <p className={styles['title']}>{title}</p>
        {children != null ? <div className={styles['text']}>{children}</div> : null}
      </div>
      {action ? <div className={styles['action']}>{action}</div> : null}
    </div>
  );
}
