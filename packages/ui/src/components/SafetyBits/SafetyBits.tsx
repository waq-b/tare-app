// Small pieces used around the safety screens and pain flags.
import { Icon, type IconName } from '@tare/icons';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './SafetyBits.module.css';

export interface EmergencyShortcutProps {
  /** The question, e.g. "Chest pain, or struggling to breathe?". */
  label: string;
  href?: string;
  onClick?: () => void;
}

/** A way out to the 999 screen from anywhere in the pain-flag flow. */
export function EmergencyShortcut({ label, href, onClick }: EmergencyShortcutProps) {
  const inner = (
    <>
      <Icon name="phone" size={20} />
      <span className={styles['esLabel']}>{label}</span>
      <span className={styles['es999']}>999</span>
    </>
  );
  return href ? (
    <a href={href} className={styles['es']}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={styles['es']}>
      {inner}
    </button>
  );
}

export interface IconListItem {
  icon: IconName;
  text: ReactNode;
}

/** A short list with an icon per line. */
export function IconList({
  items,
  onEmergency = false,
}: {
  items: readonly IconListItem[];
  onEmergency?: boolean;
}) {
  return (
    <ul className={cx(styles['iconList'], onEmergency && styles['onEmergency'])}>
      {items.map((it, i) => (
        <li key={i}>
          <Icon name={it.icon} size={20} />
          <span>{it.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Exercises dropped from today by a safety rule's engine action. */
export function RemovedItemList({ items, label }: { items: readonly string[]; label: string }) {
  return (
    <div className={styles['removed']}>
      <p className={styles['removedLabel']}>{label}</p>
      <ul>
        {items.map((it) => (
          <li key={it}>
            <Icon name="minus" size={18} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Not medical advice", said once, clearly, at onboarding (hard line 6). */
export function DisclaimerCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className={styles['disclaimer']}>
      <Icon name="shield" size={24} />
      <div>
        <p className={styles['disclaimerTitle']}>{title}</p>
        <div className={styles['disclaimerBody']}>{children}</div>
      </div>
    </div>
  );
}
