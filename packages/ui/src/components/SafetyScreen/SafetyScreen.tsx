import { Icon, type IconName } from '@tare/icons';
import { tokens } from '@tare/tokens';
import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { serviceActions, type Region, type ServiceData } from '../../lib/services';
import { Button } from '../Button/Button';
import { IconTile } from '../IconTile/IconTile';
import { SafetyLockNote } from '../SafetyLockNote/SafetyLockNote';
import { SourceLink, type SourceData } from '../SourceLink/SourceLink';
import styles from './SafetyScreen.module.css';

/** The parts of a safety_rules.json rule this screen shows. Passed in whole, never edited. */
export interface SafetyRuleView {
  id: string;
  action: string;
  user_message: string;
  sources: readonly SourceData[];
  services: readonly string[];
}

/** Fixed UI labels per safety `action` (decided 2026-09-22). Words about the person's
 * situation always come from the rule's `user_message`, never from here. */
export const SAFETY_LEVELS: Record<string, { eyebrow: string; title: string; icon: IconName }> = {
  stop_now_call_999: { eyebrow: 'Emergency', title: 'Stop and call 999.', icon: 'phone' },
  stop_and_contact_111: { eyebrow: 'Urgent', title: 'Get medical advice today.', icon: 'phone' },
  stop_and_see_gp: { eyebrow: 'See your GP', title: 'Stop and check with your GP.', icon: 'alert' },
  reduce_or_rest: { eyebrow: 'Rest', title: 'Rest and recover.', icon: 'moon' },
  modify_exercise: { eyebrow: 'Modify', title: 'Change today’s session.', icon: 'swap' },
  continue_with_caution: { eyebrow: 'Take care', title: 'Carry on, carefully.', icon: 'info' },
};
/** Unknown actions (the data only adds) get the cautious GP presentation, never silence. */
const FALLBACK = {
  eyebrow: 'Get advice',
  title: 'Stop and get advice.',
  icon: 'alert' as IconName,
};

export interface SafetyScreenProps {
  rule: SafetyRuleView;
  /** safety_rules.json → services. */
  services: Readonly<Record<string, ServiceData>>;
  region: Region;
  /** App actions after the services, e.g. "Continue with changes", "End session". */
  actions?: ReactNode;
  /** Extra app content before the actions, e.g. the exercises removed today. */
  children?: ReactNode;
}

/** A safety result. Shows the rule's `user_message` exactly as written (hard line 3). */
export function SafetyScreen({ rule, services, region, actions, children }: SafetyScreenProps) {
  const level = SAFETY_LEVELS[rule.action] ?? FALLBACK;
  const look = (tokens.safety as Record<string, { color: string; emphasis: string }>)[
    rule.action
  ] ?? {
    color: 'warning',
    emphasis: 'fill',
  };
  const solid = look.emphasis === 'solid';
  const c = look.color;
  const vars = {
    '--c': `var(--${c})`,
    '--c-tint': `var(--${c}-tint)`,
    '--c-edge': `var(--${c}-edge)`,
    '--c-ink': `var(--${c}-on-tint)`,
  } as CSSProperties;
  const links = serviceActions(rule.services, services, region);
  const toneVariant = (['warning', 'deload', 'swap', 'hold'] as const).find((t) => t === c);

  return (
    <section
      className={cx(styles['screen'], styles[look.emphasis])}
      style={vars}
      aria-labelledby={`${rule.id}-title`}
    >
      <div className={styles['panel']}>
        <IconTile size={solid ? 72 : 64} tone={solid ? 'on-emergency' : 'neutral'}>
          <Icon name={level.icon} size={solid ? 32 : 28} />
        </IconTile>
        <p className={styles['eyebrow']}>{level.eyebrow}</p>
        <h1 id={`${rule.id}-title`} className={styles['title']}>
          {level.title}
        </h1>
        <p className={styles['message']} data-testid="safety-message">
          {rule.user_message}
        </p>
      </div>

      {children}

      {links.length || actions ? (
        <div className={styles['actions']}>
          {links.map((l, i) => (
            <div key={l.id} className={styles['action']}>
              <Button
                href={l.href}
                external={l.kind === 'web'}
                fullWidth
                size={i === 0 ? 60 : 52}
                variant={
                  i === 0
                    ? solid
                      ? 'emergency'
                      : (toneVariant ?? 'primary')
                    : solid
                      ? 'emergency-outline'
                      : 'secondary-outline'
                }
                icon={<Icon name={l.kind === 'tel' ? 'phone' : 'ext'} size={20} />}
              >
                {l.label}
              </Button>
              {l.note ? <p className={styles['serviceNote']}>{l.note}</p> : null}
            </div>
          ))}
          {actions}
        </div>
      ) : null}

      {rule.sources.length ? (
        <div className={styles['sources']}>
          <h2 className={styles['sourcesTitle']}>Sources</h2>
          <ul className={styles['sourceList']}>
            {rule.sources.map((s) => (
              <li key={`${s.org}-${s.title}`}>
                <SourceLink source={s} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <SafetyLockNote />
    </section>
  );
}
