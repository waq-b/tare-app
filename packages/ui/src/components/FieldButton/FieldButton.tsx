import { Icon } from '@tare/icons';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { SectionLabel } from '../SectionLabel/SectionLabel';
import styles from './FieldButton.module.css';

export interface FieldButtonProps {
  label: string;
  /** The current value. Empty shows `placeholder` in a dashed (optional) field. */
  value?: ReactNode;
  placeholder?: string;
  onClick?: () => void;
}

/** A form value you tap to change (opens a picker or sheet). */
export function FieldButton({ label, value, placeholder = 'Add', onClick }: FieldButtonProps) {
  const empty = value == null || value === '';
  return (
    <div className={styles['field']}>
      <SectionLabel as="div">{label}</SectionLabel>
      <button
        type="button"
        onClick={onClick}
        className={cx(styles['btn'], empty && styles['empty'])}
      >
        <span className={styles['value']}>{empty ? placeholder : value}</span>
        <span className="sr-only">, change {label}</span>
        <Icon name={empty ? 'plus' : 'chev-r'} size={20} />
      </button>
    </div>
  );
}
