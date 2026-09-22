// Boards: Notif-Push (mocks), Notif-Centre, Notif-Settings.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { notifications } from '../../fixtures';
import { IconButton } from '../../src/components/IconButton/IconButton';
import {
  NotificationItem,
  PushNotification,
  QuietHoursCard,
  ResponseButtons,
} from '../../src/components/Notifications/Notifications';
import { SectionLabel } from '../../src/components/SectionLabel/SectionLabel';
import { ToggleRow } from '../../src/components/Switch/Switch';
import { TextLink } from '../../src/components/TextLink/TextLink';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = {
  title: 'Screens/Notifications',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const PushMocks: Story = {
  name: 'Push mocks',
  render: () => (
    <ScreenFrame>
      <ScreenBody gap={16}>
        <h1 className="sr-only">Push notifications</h1>
        <div style={{ paddingTop: 24 }} className={s['stack']}>
          <SectionLabel as="h2">Coach (P2: the one push)</SectionLabel>
          <PushNotification
            title="Weekly review ready"
            body="4 proposed changes to look at."
            time="now"
          />
        </div>
        <div className={s['stack']}>
          <SectionLabel as="h2">Time-sensitive</SectionLabel>
          <PushNotification title="Rest is up" body="Set 3 · 62.5 × 6" time="now" />
        </div>
        <div className={s['stack']}>
          <SectionLabel as="h2">Body and safety</SectionLabel>
          <PushNotification
            title="How is your right shoulder?"
            body="You flagged it on Thu 17 Sep."
            time="08:00"
            actions={['Better', 'Same', 'Worse']}
          />
          <PushNotification
            title="Weigh-in"
            body="Any day works. Charts use the 7-day average."
            time="07:00"
          />
        </div>
      </ScreenBody>
    </ScreenFrame>
  ),
};

const time = (iso: string) => iso.slice(11, 16);
const isToday = (iso: string) => iso.startsWith('2026-09-22');

export const Centre: Story = {
  render: () => (
    <ScreenFrame>
      <TopBar
        back={{ href: '#' }}
        title="Notifications"
        actions={<IconButton icon="gear" label="Notification settings" href="#" />}
      />
      <ScreenBody gap={8}>
        {(['Today', 'Earlier'] as const).map((group) => (
          <section key={group}>
            <SectionLabel>{group}</SectionLabel>
            {notifications
              .filter((n) => (group === 'Today' ? isToday(n.at) : !isToday(n.at)))
              .map((n) => (
                <NotificationItem
                  key={n.id}
                  category={n.category}
                  title={n.title}
                  body={n.body}
                  time={group === 'Today' ? time(n.at) : 'Sun 20 Sep'}
                  unread={!n.read}
                >
                  {n.response === 'better_same_worse' ? (
                    <ResponseButtons subject={n.title} />
                  ) : null}
                  {n.response === 'open_review' ? (
                    <TextLink href="#" chevron>
                      Open review
                    </TextLink>
                  ) : null}
                </NotificationItem>
              ))}
          </section>
        ))}
      </ScreenBody>
    </ScreenFrame>
  ),
};

export const Settings: Story = {
  render: function Render() {
    const [on, setOn] = useState({
      rest: true,
      session: true,
      review: true,
      weigh: false,
      quiet: true,
    });
    return (
      <ScreenFrame>
        <TopBar
          back={{ href: '#' }}
          title="Notifications"
          subtitle="What Tare tells you, and when"
        />
        <ScreenBody gap={18}>
          <div>
            <ToggleRow
              title="Rest timer"
              description="Buzz and banner when rest ends"
              checked={on.rest}
              onChange={(v) => setOn({ ...on, rest: v })}
            />
            <ToggleRow
              title="Session reminder"
              description="07:30 on training days"
              checked={on.session}
              onChange={(v) => setOn({ ...on, session: v })}
            />
            <ToggleRow
              title="Weekly review ready"
              description="When your Claude has written it"
              checked={on.review}
              onChange={(v) => setOn({ ...on, review: v })}
            />
            <ToggleRow
              title="Safety follow-ups"
              description="Checks in after a pain flag. Always on."
              checked
              locked
            />
            <ToggleRow
              title="Weigh-in reminder"
              description="Fridays, 07:00"
              checked={on.weigh}
              onChange={(v) => setOn({ ...on, weigh: v })}
            />
            <ToggleRow title="Ride nudges" description="Coming later" checked={false} disabled />
          </div>
          <QuietHoursCard
            on={on.quiet}
            onChange={(v) => setOn({ ...on, quiet: v })}
            from="22:00"
            to="07:00"
          />
        </ScreenBody>
      </ScreenFrame>
    );
  },
};
