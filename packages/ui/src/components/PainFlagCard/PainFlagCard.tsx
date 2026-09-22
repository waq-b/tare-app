import { Icon } from '@tare/icons';
import { tokens } from '@tare/tokens';
import type { CSSProperties } from 'react';
import { Button } from '../Button/Button';
import { Tag } from '../Tag/Tag';
import { TextLink } from '../TextLink/TextLink';
import styles from './PainFlagCard.module.css';

export interface PainFlagCardProps {
  /** "Right shoulder" */
  area: string;
  /** "Flagged Thu 17 Sep" */
  when: string;
  status: 'active' | 'cleared';
  /** The matched rule's action and message, shown verbatim (hard line 3). */
  rule: { action: string; user_message: string };
  onStillHurts?: () => void;
  onFeelsClear?: () => void;
  allFlagsHref?: string;
}

/** A pain flag on the Body screen, in the colour of its safety level. */
export function PainFlagCard({
  area,
  when,
  status,
  rule,
  onStillHurts,
  onFeelsClear,
  allFlagsHref,
}: PainFlagCardProps) {
  const look = (tokens.safety as Record<string, { color: string }>)[rule.action] ?? {
    color: 'warning',
  };
  const c = look.color === 'safety-stop-solid' ? 'safety-stop' : look.color;
  return (
    <section
      className={styles['card']}
      style={{ '--c': `var(--${c})`, '--c-ink': `var(--${c}-on-tint)` } as CSSProperties}
      aria-label={`Pain flag: ${area}`}
    >
      <div className={styles['head']}>
        <Icon name="flag" size={20} />
        <h3 className={styles['area']}>{area}</h3>
        <Tag tone={status === 'active' ? 'warning' : 'neutral'}>
          {status === 'active' ? 'Active' : 'Cleared'}
        </Tag>
      </div>
      <p className={styles['when']}>{when}</p>
      <p className={styles['message']}>{rule.user_message}</p>
      {status === 'active' ? (
        <div className={styles['actions']}>
          <Button variant="secondary" size={52} onClick={onStillHurts}>
            Still hurts
          </Button>
          <Button variant="secondary" size={52} onClick={onFeelsClear}>
            Feels clear
          </Button>
        </div>
      ) : null}
      {allFlagsHref ? (
        <TextLink href={allFlagsHref} chevron>
          All pain flags
        </TextLink>
      ) : null}
    </section>
  );
}
