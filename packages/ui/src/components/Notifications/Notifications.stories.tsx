import type { Meta, StoryObj } from '@storybook/react-vite';
import { notifications } from '../../../fixtures';
import { TextLink } from '../TextLink/TextLink';
import {
  AppMark,
  NotificationItem,
  PushNotification,
  QuietHoursCard,
  ResponseButtons,
} from './Notifications';

const meta = {
  title: 'Components/Notifications/NotificationItem',
  component: NotificationItem,
} satisfies Meta<typeof NotificationItem>;
export default meta;
type Story = StoryObj<typeof meta>;

const time = (iso: string) => iso.slice(11, 16);

export const Centre: Story = {
  args: { category: 'plan', title: '', body: '', time: '' },
  render: () => (
    <div>
      {notifications.map((n) => (
        <NotificationItem
          key={n.id}
          category={n.category}
          title={n.title}
          body={n.body}
          time={time(n.at)}
          unread={!n.read}
        >
          {n.response === 'better_same_worse' ? <ResponseButtons subject={n.title} /> : null}
          {n.response === 'open_review' ? (
            <TextLink href="#" chevron>
              Open review
            </TextLink>
          ) : null}
        </NotificationItem>
      ))}
    </div>
  ),
};
export const ResponseButtonsStory: Story = {
  name: 'ResponseButtons',
  args: { category: 'plan', title: '', body: '', time: '' },
  render: () => <ResponseButtons subject="Right shoulder" />,
};
export const PushNotificationStory: Story = {
  name: 'PushNotification',
  args: { category: 'plan', title: '', body: '', time: '' },
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <PushNotification
        title="Weekly review ready"
        body="4 proposed changes to look at."
        time="now"
      />
      <PushNotification
        title="How is your right shoulder?"
        body="You flagged it on Thu 17 Sep."
        time="08:00"
        actions={['Better', 'Same', 'Worse']}
      />
    </div>
  ),
};
export const AppMarkStory: Story = {
  name: 'AppMark',
  args: { category: 'plan', title: '', body: '', time: '' },
  render: () => <AppMark size={56} />,
};
export const QuietHoursCardStory: Story = {
  name: 'QuietHoursCard',
  args: { category: 'plan', title: '', body: '', time: '' },
  render: () => <QuietHoursCard on from="22:00" to="07:00" />,
};
