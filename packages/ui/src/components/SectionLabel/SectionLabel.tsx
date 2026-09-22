import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './SectionLabel.module.css';

export interface SectionLabelProps {
  children: ReactNode;
  /** Right-aligned value, e.g. "8 weeks". */
  trailing?: ReactNode;
  as?: 'h2' | 'h3' | 'div';
  className?: string;
}

/** 11px uppercase label with 0.1em tracking (type.label). */
export function SectionLabel({ children, trailing, as: As = 'h2', className }: SectionLabelProps) {
  return (
    <div className={cx(styles['wrap'], className)}>
      <As className={styles['label']}>{children}</As>
      {trailing != null ? <span className={styles['trailing']}>{trailing}</span> : null}
    </div>
  );
}
