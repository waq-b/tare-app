import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { SectionLabel } from '../SectionLabel/SectionLabel';
import styles from './EffortTap.module.css';

export type SetEffort = 'easy' | 'ok' | 'hard';
export type SessionFeel = 'easy' | 'good' | 'tough' | 'wrecked';

const SET = [
  { value: 'easy', label: 'Easy' },
  { value: 'ok', label: 'OK' },
  { value: 'hard', label: 'Hard' },
] as const;
const SESSION = [
  { value: 'easy', label: 'Easy' },
  { value: 'good', label: 'Good' },
  { value: 'tough', label: 'Tough' },
  { value: 'wrecked', label: 'Wrecked' },
] as const;

type Props<S extends 'set' | 'session'> = {
  scale: S;
  /** e.g. "How was set 2?" ("· optional" is added). */
  question: string;
  value: (S extends 'set' ? SetEffort : SessionFeel) | null;
  onChange?: (value: S extends 'set' ? SetEffort : SessionFeel) => void;
};

/** Optional effort after a set (Easy/OK/Hard) or a session (Easy…Wrecked). Never blocks.
 * The app maps these to RPE with tr.global.effort_set_map / effort_session_map. */
export function EffortTap<S extends 'set' | 'session'>({
  scale,
  question,
  value,
  onChange,
}: Props<S>) {
  const options = (scale === 'set' ? SET : SESSION) as readonly { value: string; label: string }[];
  return (
    <div className={styles['wrap']}>
      <SectionLabel as="div">{question} · optional</SectionLabel>
      <SegmentedControl
        label={question}
        options={options}
        value={value}
        onChange={(v) => onChange?.(v as never)}
      />
    </div>
  );
}
