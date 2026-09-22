import { IconButton } from '../IconButton/IconButton';
import styles from './CopyField.module.css';

export interface CopyFieldProps {
  value: string;
  /** What's being copied, for the button's name ("Copy server URL"). */
  copyLabel: string;
  /** The app writes to the clipboard; the component only asks. */
  onCopy?: (value: string) => void;
}

export function CopyField({ value, copyLabel, onCopy }: CopyFieldProps) {
  return (
    <div className={styles['field']}>
      <span className={styles['value']}>{value}</span>
      <IconButton icon="copy" label={copyLabel} onClick={() => onCopy?.(value)} />
    </div>
  );
}
