import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';

const meta = {
  title: 'Components/Actions/IconButton',
  component: IconButton,
  args: { icon: 'gear', label: 'Settings' },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};
export const Outlined: Story = { args: { icon: 'flag', label: 'Flag pain', variant: 'outlined' } };
export const WithBadge: Story = {
  args: { icon: 'bell', label: 'Notifications, 1 new', badge: true },
};
export const AsLink: Story = { args: { icon: 'chev-l', label: 'Back', href: '#' } };
