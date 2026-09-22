import { Icon } from '@tare/icons';
import { useId, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Switch.module.css';

export interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** Accessible name. Visually hidden when used inside a ToggleRow. */
  label: string;
  disabled?: boolean;
  /** Always on and can't be changed (e.g. safety follow-ups). Shows a lock. */
  locked?: boolean;
}

/** 52×32 switch on a native checkbox (role="switch"). */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  locked = false,
}: SwitchProps) {
  return (
    <label className={cx(styles['switch'], (disabled || locked) && styles['off'])}>
      <input
        type="checkbox"
        role="switch"
        className={styles['input']}
        checked={locked ? true : checked}
        disabled={disabled || locked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="sr-only">
        {label}
        {locked ? ' (always on)' : ''}
      </span>
      <span aria-hidden="true" className={styles['track']}>
        <span className={styles['knob']}>{locked ? <Icon name="lock" size={14} /> : null}</span>
      </span>
    </label>
  );
}

export interface ToggleRowProps extends Omit<SwitchProps, 'label'> {
  title: ReactNode;
  description?: ReactNode;
}

/** A settings row: title, description, switch. The whole row is the hit area. */
export function ToggleRow({ title, description, ...sw }: ToggleRowProps) {
  const id = useId();
  return (
    <div className={styles['row']}>
      <div className={styles['text']} id={id}>
        <span className={styles['title']}>{title}</span>
        {description != null ? <span className={styles['desc']}>{description}</span> : null}
      </div>
      <Switch {...sw} label={typeof title === 'string' ? title : 'Toggle'} />
    </div>
  );
}
