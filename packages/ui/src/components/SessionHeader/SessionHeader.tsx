import styles from './SessionHeader.module.css';

export interface SessionHeaderProps {
  title: string;
  /** "~55 min" */
  duration?: string;
  deload?: boolean;
  as?: 'h2' | 'h3';
}

export function SessionHeader({
  title,
  duration,
  deload = false,
  as: As = 'h2',
}: SessionHeaderProps) {
  return (
    <div className={styles['head']}>
      <As className={styles['title']}>
        {title}
        {deload ? <span className={styles['deload']}> · deload</span> : null}
      </As>
      {duration ? (
        <span className={styles['duration']}>
          <span className="sr-only">About </span>
          {duration}
        </span>
      ) : null}
    </div>
  );
}
