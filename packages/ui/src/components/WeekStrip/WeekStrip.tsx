import { Icon } from '@tare/icons';
import { cx } from '../../lib/cx';
import styles from './WeekStrip.module.css';

export type DayState = 'done' | 'planned' | 'rest' | 'ride' | 'deload';

export interface WeekDay {
  /** "M", "T", … */
  letter: string;
  /** Full day for screen readers, e.g. "Tuesday 22 September". */
  name: string;
  date: number;
  state: DayState;
  today?: boolean;
}

const WORDS: Record<DayState, string> = {
  done: 'session done',
  planned: 'session planned',
  rest: 'rest day',
  ride: 'ride',
  deload: 'deload session planned',
};

/** This week at a glance: done, planned, rest, ride, deload; today ringed. */
export function WeekStrip({ days }: { days: readonly WeekDay[] }) {
  return (
    <ol className={styles['strip']} aria-label="This week">
      {days.map((d) => (
        <li key={d.name} className={styles['day']}>
          <span
            className={cx(styles['letter'], d.today && styles['todayLetter'])}
            aria-hidden="true"
          >
            {d.letter}
          </span>
          <span
            className={cx(styles['marker'], styles[d.state], d.today && styles['today'])}
            aria-hidden="true"
          >
            {d.state === 'done' ? <Icon name="check" size={16} strokeWidth={2.25} /> : null}
            {d.state === 'ride' ? <Icon name="bike" size={16} /> : null}
            {d.state === 'rest' ? <span className={styles['dot']} /> : null}
          </span>
          <span className={styles['date']} aria-hidden="true">
            {d.date}
          </span>
          <span className="sr-only">
            {d.name}
            {d.today ? ', today' : ''}: {WORDS[d.state]}
          </span>
        </li>
      ))}
    </ol>
  );
}
