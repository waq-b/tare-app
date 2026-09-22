import type { ReactNode } from 'react';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import styles from './QuestionRow.module.css';

export interface QuestionRowProps {
  number: number;
  /** The question, word for word from sf.screening.questions. */
  question: string;
  value: 'yes' | 'no' | null;
  onChange?: (value: 'yes' | 'no') => void;
  /** Shown when the answer is yes (e.g. the body-area picker for msk_issue). */
  followUp?: ReactNode;
}

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

/** A screening question with Yes / No. */
export function QuestionRow({ number, question, value, onChange, followUp }: QuestionRowProps) {
  return (
    <div className={styles['row']}>
      <div className={styles['q']}>
        <span className={styles['n']} aria-hidden="true">
          {number}
        </span>
        <p className={styles['text']}>{question}</p>
      </div>
      <SegmentedControl
        label={question}
        tone="neutral"
        options={YES_NO}
        value={value}
        {...(onChange ? { onChange } : {})}
      />
      {value === 'yes' && followUp ? <div className={styles['follow']}>{followUp}</div> : null}
    </div>
  );
}
