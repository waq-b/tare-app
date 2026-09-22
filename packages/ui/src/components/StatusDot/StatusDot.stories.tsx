import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusDot } from './StatusDot';

const meta = {
  title: 'Components/Feedback/StatusDot',
  component: StatusDot,
  args: { children: 'MCP server connected', tone: 'progress' },
} satisfies Meta<typeof StatusDot>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Connected: Story = {};
export const Problem: Story = { args: { children: 'Connection lost', tone: 'warning' } };
