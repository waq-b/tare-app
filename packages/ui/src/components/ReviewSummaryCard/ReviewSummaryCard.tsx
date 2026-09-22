import { Icon } from '@tare/icons';
import { SectionLabel } from '../SectionLabel/SectionLabel';
import styles from './ReviewSummaryCard.module.css';

export interface ReviewSummaryCardProps {
  /** "Week 8 · 14–20 Sep" */
  week: string;
  /** "3 of 3 sessions" */
  sessions: string;
  /** The AI's summary paragraph. */
  summary: string;
  /** "Sun 20 Sep, 19:02" */
  writtenAt: string;
}

/** The weekly review's summary, clearly attributed to the user's own Claude. */
export function ReviewSummaryCard({ week, sessions, summary, writtenAt }: ReviewSummaryCardProps) {
  return (
    <section className={styles['card']}>
      <SectionLabel as="h2" trailing={sessions}>
        {week}
      </SectionLabel>
      <p className={styles['summary']}>{summary}</p>
      <p className={styles['by']}>
        <Icon name="coach" size={16} />
        Written by your Claude · {writtenAt}
      </p>
    </section>
  );
}
