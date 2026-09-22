import { Icon } from '@tare/icons';
import { useState } from 'react';
import { num } from '../../lib/format';
import styles from './NumberStepper.module.css';

export interface NumberStepperProps {
  /** "Weight", "Reps". Names the buttons ("Increase Weight"). */
  label: string;
  value: number;
  onChange?: (value: number) => void;
  step: number;
  min?: number;
  max?: number;
  unit?: string;
  /** 72 (sheets) or 76 (large, e.g. weigh-in). */
  size?: 72 | 76;
}

/** −/+ with the value in the middle. Tap the value to type one. */
export function NumberStepper({
  label,
  value,
  onChange,
  step,
  min = 0,
  max = Infinity,
  unit,
  size = 72,
}: NumberStepperProps) {
  const [typing, setTyping] = useState(false);
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 100) / 100));
  return (
    <div className={styles['stepper']} style={{ ['--s' as string]: `${size}px` }}>
      <button
        type="button"
        className={styles['btn']}
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange?.(clamp(value - step))}
      >
        <Icon name="minus" size={26} />
      </button>
      {typing ? (
        <input
          className={styles['input']}
          type="number"
          inputMode="decimal"
          step={step}
          aria-label={label}
          defaultValue={value}
          autoFocus
          onBlur={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange?.(clamp(n));
            setTyping(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') setTyping(false);
          }}
        />
      ) : (
        <button type="button" className={styles['value']} onClick={() => setTyping(true)}>
          <span className={styles['num']}>{num(value)}</span>
          {unit ? <span className={styles['unit']}>{unit}</span> : null}
          <span className="sr-only">. {label}. Tap to type.</span>
        </button>
      )}
      <button
        type="button"
        className={styles['btn']}
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange?.(clamp(value + step))}
      >
        <Icon name="plus" size={26} />
      </button>
    </div>
  );
}
