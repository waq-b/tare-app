import { Icon } from '@tare/icons';
import { cx } from '../../lib/cx';
import { conventionSuffix, loadText, type LoadConvention } from '../../lib/format';
import { Tag } from '../Tag/Tag';
import styles from './SetRow.module.css';

export type SetRowState = 'warmup' | 'done' | 'current' | 'upcoming';

export interface SetRowProps {
  state: SetRowState;
  /** 1-based set number within its kind (warm-ups W1…, working sets 1…). */
  index: number;
  load: number | null;
  reps: number;
  unit?: string;
  loadConvention?: LoadConvention;
  /** Done sets: the effort tapped ("OK"). */
  effort?: string;
  /** Current set: last time's result, shown faintly as the target ("67.5×8"). */
  lastTime?: string;
  /** Logs the set (or undoes it when done). */
  onCheck?: () => void;
  /** Warm-up done state (warm-ups are logged but never count). */
  warmupDone?: boolean;
}

function checkLabel(state: SetRowState, index: number, warmupDone: boolean): string {
  if (state === 'warmup')
    return warmupDone ? `Warm-up ${index} done, undo` : `Mark warm-up ${index} done`;
  if (state === 'done') return `Set ${index} done, undo`;
  if (state === 'current') return `Mark set ${index} done as planned`;
  return `Mark set ${index} done`;
}

/** One set in the Ledger. One tap on the check logs it as planned. */
export function SetRow({
  state,
  index,
  load,
  reps,
  unit = 'kg',
  loadConvention,
  effort,
  lastTime,
  onCheck,
  warmupDone = true,
}: SetRowProps) {
  const filled = state === 'done' || (state === 'warmup' && warmupDone);
  const suffix = conventionSuffix(loadConvention);
  return (
    <div className={cx(styles['row'], styles[state])}>
      <span className={styles['index']}>
        <span className="sr-only">{state === 'warmup' ? 'Warm-up ' : 'Set '}</span>
        {state === 'warmup' ? `W${index}` : index}
      </span>
      <div className={styles['figures']}>
        <span className={styles['load']}>
          <span className={styles['num']}>{loadText(load, loadConvention)}</span>
          {load != null && loadConvention !== 'bodyweight' ? (
            <span className={styles['unit']}>
              {unit}
              {suffix ? ` ${suffix}` : ''}
            </span>
          ) : null}
        </span>
        <span className={styles['times']} aria-hidden="true">
          ×
        </span>
        <span className="sr-only">times</span>
        <span className={styles['num']}>{reps}</span>
        <span className={styles['spacer']} />
        {state === 'done' && effort ? <Tag>{effort}</Tag> : null}
        {state === 'current' && lastTime ? (
          <span className={styles['last']}>
            <span className="sr-only">Last time </span>
            {lastTime}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onCheck}
        aria-label={checkLabel(state, index, warmupDone)}
        className={cx(
          styles['check'],
          filled && styles['checkDone'],
          state === 'current' && styles['checkCurrent'],
        )}
      >
        {filled || state === 'current' ? <Icon name="check" size={26} strokeWidth={2.25} /> : null}
      </button>
    </div>
  );
}
