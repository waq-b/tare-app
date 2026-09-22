import { Icon, type IconName } from '@tare/icons';
import { cx } from '../../lib/cx';
import styles from './BottomNav.module.css';

export type Tab = 'today' | 'plan' | 'progress' | 'coach';

const TABS: { tab: Tab; label: string; icon: IconName }[] = [
  { tab: 'today', label: 'Today', icon: 'today' },
  { tab: 'plan', label: 'Plan', icon: 'plan' },
  { tab: 'progress', label: 'Progress', icon: 'chart' },
  { tab: 'coach', label: 'Coach', icon: 'coach' },
];

export interface BottomNavProps {
  /** The current tab, or null on screens that belong to none. */
  active: Tab | null;
  /** Tabs with something new (e.g. a review ready on Coach). */
  badges?: Partial<Record<Tab, boolean>>;
  /** Link target per tab. The app supplies its routes. */
  hrefFor?: (tab: Tab) => string;
}

export function BottomNav({ active, badges = {}, hrefFor = (t) => `#${t}` }: BottomNavProps) {
  return (
    <nav aria-label="Main" className={styles['nav']}>
      {TABS.map(({ tab, label, icon }) => (
        <a
          key={tab}
          href={hrefFor(tab)}
          aria-current={active === tab ? 'page' : undefined}
          className={cx(styles['item'], active === tab && styles['active'])}
        >
          {active === tab ? <span className={styles['indicator']} aria-hidden="true" /> : null}
          {badges[tab] ? <span className={styles['badge']} aria-hidden="true" /> : null}
          <Icon name={icon} size={24} />
          <span>
            {label}
            {badges[tab] ? <span className="sr-only">, new</span> : null}
          </span>
        </a>
      ))}
    </nav>
  );
}
