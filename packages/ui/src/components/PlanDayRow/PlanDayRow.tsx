import { Icon } from '@tare/icons';
import { IconButton } from '../IconButton/IconButton';
import styles from './PlanDayRow.module.css';

/** The A/B/C letter tile for a session. */
export function SessionBadge({ letter }: { letter: string }) {
  return (
    <span className={styles['badge']} aria-hidden="true">
      {letter}
    </span>
  );
}

export type PlanDayRowProps =
  | { kind: 'rest'; day: string }
  | { kind: 'ride'; day: string; label?: string }
  | {
      kind: 'session';
      day: string;
      letter: string;
      title: string;
      /** "Bench · Pulldown · Incline DB · …" */
      summary: string;
      href?: string;
      onReorder?: () => void;
    };

/** One day in the week plan. */
export function PlanDayRow(props: PlanDayRowProps) {
  if (props.kind !== 'session') {
    return (
      <div className={styles['compact']}>
        <span className={styles['day']}>{props.day}</span>
        <Icon name={props.kind === 'ride' ? 'bike' : 'moon'} size={18} />
        <span className={styles['quiet']}>
          {props.kind === 'ride' ? (props.label ?? 'Ride · optional') : 'Rest'}
        </span>
      </div>
    );
  }
  const { day, letter, title, summary, href, onReorder } = props;
  const main = (
    <>
      <SessionBadge letter={letter} />
      <span className={styles['text']}>
        <span className={styles['title']}>
          <span className="sr-only">{day}: </span>
          {title}
        </span>
        <span className={styles['summary']}>{summary}</span>
      </span>
    </>
  );
  return (
    <div className={styles['session']}>
      <span className={styles['day']} aria-hidden="true">
        {day}
      </span>
      <div className={styles['card']}>
        {href ? (
          <a href={href} className={styles['main']}>
            {main}
          </a>
        ) : (
          <div className={styles['main']}>{main}</div>
        )}
        {onReorder ? <IconButton icon="grip" label={`Move ${title}`} onClick={onReorder} /> : null}
      </div>
    </div>
  );
}
