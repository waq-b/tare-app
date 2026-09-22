import type { ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton';
import { StepProgress, type StepProgressProps } from '../StepProgress/StepProgress';
import styles from './TopBar.module.css';

export interface TopBarBack {
  label?: string;
  href?: string;
  onClick?: () => void;
}

export interface TopBarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Shows a back button. Omit for tab roots. */
  back?: TopBarBack;
  /** Trailing icon buttons (e.g. notifications, settings). */
  actions?: ReactNode;
  /** Onboarding: a step bar instead of a title. */
  progress?: Pick<StepProgressProps, 'total' | 'done' | 'label'>;
}

/** Screen header. Tab roots: title + subtitle + actions. Drill-ins: back + title.
 * Onboarding: back + step bar. Leaves room for the phone's status bar (safe area). */
export function TopBar({ title, subtitle, back, actions, progress }: TopBarProps) {
  return (
    <header className={styles['bar']}>
      {back ? (
        <IconButton
          icon="chev-l"
          label={back.label ?? 'Back'}
          {...(back.href ? { href: back.href } : {})}
          {...(back.onClick ? { onClick: back.onClick } : {})}
        />
      ) : null}
      <div className={styles['main']}>
        {progress ? <StepProgress {...progress} /> : null}
        {title != null ? <h1 className={styles['title']}>{title}</h1> : null}
        {subtitle != null ? <p className={styles['subtitle']}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles['actions']}>{actions}</div> : null}
    </header>
  );
}
