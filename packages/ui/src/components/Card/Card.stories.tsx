import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta = {
  title: 'Components/Structure/Card',
  component: Card,
  args: { children: 'Your own Claude reads your logs and writes the weekly review.' },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Raised: Story = {};
export const Ground: Story = { args: { level: 'ground' } };
export const AsLink: Story = { args: { href: '#', 'aria-label': 'Connect your AI' } };
