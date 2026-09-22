import { Icon, type IconName } from '@tare/icons';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { IconTile } from '../IconTile/IconTile';
import { Switch } from '../Switch/Switch';
import styles from './Notifications.module.css';

export type NotificationCategory = 'safety' | 'plan' | 'coach' | 'sync' | 'deload';

const CAT: Record<
  NotificationCategory,
  { icon: IconName; tone: 'warning' | 'neutral' | 'accent' | 'deload' }
> = {
  safety: { icon: 'shield', tone: 'warning' },
  plan: { icon: 'plan', tone: 'neutral' },
  coach: { icon: 'coach', tone: 'accent' },
  sync: { icon: 'cloud-ok', tone: 'neutral' },
  deload: { icon: 'moon', tone: 'deload' },
};

/** Better / Same / Worse quick replies (e.g. a safety follow-up). */
export function ResponseButtons({
  onRespond,
  subject,
}: {
  onRespond?: (r: 'better' | 'same' | 'worse') => void;
  subject: string;
}) {
  return (
    <div className={styles['responses']} role="group" aria-label={`How is it now? ${subject}`}>
      {(['better', 'same', 'worse'] as const).map((r) => (
        <Button key={r} variant="secondary" size={44} onClick={() => onRespond?.(r)}>
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </Button>
      ))}
    </div>
  );
}

export interface NotificationItemProps {
  category: NotificationCategory;
  title: string;
  body: string;
  /** "08:00" or "Sun 20 Sep". */
  time: string;
  unread?: boolean;
  /** Inline actions, e.g. ResponseButtons or a TextLink. */
  children?: ReactNode;
}

/** One entry in the notification centre. */
export function NotificationItem({
  category,
  title,
  body,
  time,
  unread = false,
  children,
}: NotificationItemProps) {
  const c = CAT[category];
  return (
    <article className={styles['item']} aria-label={`${unread ? 'Unread: ' : ''}${title}`}>
      <IconTile size={40} tone={c.tone}>
        <Icon name={c.icon} size={20} />
      </IconTile>
      <div className={styles['body']}>
        <div className={styles['head']}>
          <h3 className={styles['title']}>{title}</h3>
          <span className={styles['time']}>{time}</span>
          {unread ? <span className={styles['unread']} aria-hidden="true" /> : null}
        </div>
        <p className={styles['text']}>{body}</p>
        {children}
      </div>
    </article>
  );
}

/** "0.0" app mark, as on the home screen and in pushes. */
export function AppMark({ size = 38 }: { size?: number }) {
  return (
    <span className={styles['mark']} style={{ width: size, height: size }} aria-hidden="true">
      0.0
    </span>
  );
}

export interface PushNotificationProps {
  title: string;
  body: string;
  time: string;
  actions?: readonly string[];
}

/** A mock of the OS push, for reviewing push copy. Not an app screen. */
export function PushNotification({ title, body, time, actions = [] }: PushNotificationProps) {
  return (
    <figure className={styles['push']} aria-label={`Push notification: ${title}`}>
      <div className={styles['pushHead']}>
        <AppMark />
        <div className={styles['pushText']}>
          <p className={styles['pushApp']}>
            <span>Tare</span>
            <span>{time}</span>
          </p>
          <p className={styles['pushTitle']}>{title}</p>
          <p className={styles['pushBody']}>{body}</p>
        </div>
      </div>
      {actions.length ? (
        <div
          className={cx(styles['pushActions'])}
          style={{ gridTemplateColumns: `repeat(${actions.length}, 1fr)` }}
        >
          {actions.map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
      ) : null}
    </figure>
  );
}

export interface QuietHoursCardProps {
  on: boolean;
  onChange?: (on: boolean) => void;
  from: string;
  to: string;
}

/** No pushes overnight, except safety follow-ups. */
export function QuietHoursCard({ on, onChange, from, to }: QuietHoursCardProps) {
  return (
    <section className={styles['quiet']}>
      <div className={styles['quietHead']}>
        <Icon name="moon" size={20} />
        <h3 className={styles['title']}>Quiet hours</h3>
        <Switch label="Quiet hours" checked={on} {...(onChange ? { onChange } : {})} />
      </div>
      <p className={styles['quietRange']}>
        {from} to {to}
      </p>
      <p className={styles['text']}>Safety follow-ups still come through.</p>
    </section>
  );
}
