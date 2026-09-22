import type { Meta, StoryObj } from '@storybook/react-vite';
import { SessionHeader } from './SessionHeader';

const meta = {
  title: 'Components/Workout/SessionHeader',
  component: SessionHeader,
  args: { title: 'Session B · Push + pull', duration: '~60 min' },
} satisfies Meta<typeof SessionHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Deload: Story = { args: { deload: true, duration: '~40 min' } };
