import { Icon } from '@tare/icons';
import type { ReactNode } from 'react';
import styles from './SafetyLockNote.module.css';

export interface SafetyLockNoteProps {
  /** Defaults to the standard lock line. The history screen passes its own. */
  children?: ReactNode;
}

/** "Set by the safety rules": no AI can change or soften a safety result (hard line 3). */
export function SafetyLockNote({ children }: SafetyLockNoteProps) {
  return (
    <p className={styles['note']}>
      <Icon name="lock" size={16} />
      <span>
        {children ?? 'Set by the safety rules. Your AI coach can’t change or soften this.'}
      </span>
    </p>
  );
}
