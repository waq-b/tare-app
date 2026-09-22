import type { ReactNode } from 'react';
import { IconTile, type IconTileProps } from '../IconTile/IconTile';
import styles from './StatusHero.module.css';

export interface StatusHeroProps {
  icon: ReactNode;
  tone?: IconTileProps['tone'];
  dashed?: boolean;
  /** Small label above the title, in the tone colour. */
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  align?: 'start' | 'center';
}

/** A big tinted icon, a statement and a short body. Screening results, rest day, empty states. */
export function StatusHero({
  icon,
  tone = 'neutral',
  dashed = false,
  eyebrow,
  title,
  children,
  align = 'start',
}: StatusHeroProps) {
  return (
    <div className={`${styles['hero']} ${align === 'center' ? styles['center'] : ''}`}>
      <IconTile size={64} tone={tone} dashed={dashed}>
        {icon}
      </IconTile>
      {eyebrow != null ? (
        <p className={`${styles['eyebrow']} ${styles[`e-${tone}`] ?? ''}`}>{eyebrow}</p>
      ) : null}
      <h2 className={styles['title']}>{title}</h2>
      {children != null ? <div className={styles['body']}>{children}</div> : null}
    </div>
  );
}
