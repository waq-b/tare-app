import { Icon } from '@tare/icons';
import styles from './SourceLink.module.css';

export interface SourceData {
  title: string;
  org: string;
  url: string | null;
  year: number | null;
}

export interface SourceLinkProps {
  source: SourceData;
  /** How many more sources the rule has (shows "+N more"). */
  more?: number;
}

/** A cited source: "NHS · Chest pain (2026)". Opens outside the app. */
export function SourceLink({ source, more = 0 }: SourceLinkProps) {
  const text = (
    <>
      <span className={styles['org']}>{source.org}</span>
      <span aria-hidden="true"> · </span>
      <span className={styles['title']}>{source.title}</span>
      {source.year ? <span className={styles['year']}> ({source.year})</span> : null}
    </>
  );
  return (
    <span className={styles['wrap']}>
      {source.url ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className={styles['link']}>
          <Icon name="book" size={16} />
          <span className={styles['text']}>{text}</span>
          <span className="sr-only"> (opens outside Tare)</span>
        </a>
      ) : (
        <span className={styles['link']}>
          <Icon name="book" size={16} />
          <span className={styles['text']}>{text}</span>
        </span>
      )}
      {more > 0 ? <span className={styles['more']}>+{more} more</span> : null}
    </span>
  );
}
