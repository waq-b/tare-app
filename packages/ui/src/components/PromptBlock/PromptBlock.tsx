import type { ReactNode } from 'react';
import styles from './PromptBlock.module.css';

export interface PromptBlockProps {
  children: ReactNode;
  /** Names the block for screen readers, e.g. "Bootstrap prompt". */
  label: string;
}

/** A block of text meant to be copied (e.g. the get_coach_brief bootstrap prompt). */
export function PromptBlock({ children, label }: PromptBlockProps) {
  return (
    <figure className={styles['block']} aria-label={label}>
      <pre className={styles['pre']}>{children}</pre>
    </figure>
  );
}
