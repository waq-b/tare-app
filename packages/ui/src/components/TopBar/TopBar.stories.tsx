import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from '../IconButton/IconButton';
import { TopBar } from './TopBar';

const meta = {
  title: 'Components/Structure/TopBar',
  component: TopBar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TopBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Root: Story = {
  args: {
    title: 'Today',
    subtitle: 'Tuesday 22 September',
    actions: (
      <>
        <IconButton icon="bell" label="Notifications, 1 new" badge />
        <IconButton icon="gear" label="Settings" />
      </>
    ),
  },
};
export const Tab: Story = { args: { title: 'Progress', subtitle: '8 weeks' } };
export const Back: Story = { args: { title: 'Settings', back: { href: '#' } } };
export const BackWithSubtitle: Story = {
  args: { title: 'Pain flags', subtitle: '2 flags · 1 active', back: { href: '#' } },
};
export const Onboarding: Story = {
  args: { back: { href: '#' }, progress: { total: 5, done: 2, label: 'Step 2 of 5' } },
};
