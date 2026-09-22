import type { ReactNode } from 'react';
import { IconTile } from '../IconTile/IconTile';
import styles from './PlaceholderAction.module.css';

export interface PlaceholderActionProps {
  icon: ReactNode;
  title: ReactNode;
  /** e.g. "Minutes + effort · coming later". */
  subtitle?: ReactNode;
}

/** An action that's planned but not built yet (e.g. "Log a ride"). Shown, never tappable. */
export function PlaceholderAction({ icon, title, subtitle }: PlaceholderActionProps) {
  return (
    <div className={styles['tile']} aria-disabled="true">
      <IconTile size={40} dashed>
        {icon}
      </IconTile>
      <div>
        <p className={styles['title']}>{title}</p>
        {subtitle != null ? <p className={styles['subtitle']}>{subtitle}</p> : null}
      </div>
    </div>
  );
}
