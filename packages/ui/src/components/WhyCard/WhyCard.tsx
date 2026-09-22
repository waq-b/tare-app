import type { ReactNode } from 'react';
import { RuleCitation, type CitedRule } from '../RuleCitation/RuleCitation';
import { SectionLabel } from '../SectionLabel/SectionLabel';
import styles from './WhyCard.module.css';

export interface WhyCardProps {
  title?: string;
  children: ReactNode;
  rules: readonly CitedRule[];
}

/** "Why": a short explanation with the rules and sources behind it. */
export function WhyCard({ title = 'Why', children, rules }: WhyCardProps) {
  return (
    <section className={styles['card']}>
      <SectionLabel as="h3">{title}</SectionLabel>
      <div className={styles['body']}>{children}</div>
      {rules.map((r) => (
        <RuleCitation key={r.id} rule={r} />
      ))}
    </section>
  );
}
