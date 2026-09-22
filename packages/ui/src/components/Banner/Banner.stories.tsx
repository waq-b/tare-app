import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button';
import { Banner } from './Banner';

const meta = {
  title: 'Components/Feedback/Banner',
  component: Banner,
  args: { tone: 'offline', title: 'Offline — logging still works' },
} satisfies Meta<typeof Banner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {
  args: { children: '3 sets saved on this phone. They sync when you’re back online.' },
};
export const Unsynced: Story = {
  args: {
    tone: 'unsynced',
    title: '2 sessions haven’t synced',
    children: 'Your coach can’t see them until they sync.',
    action: (
      <Button variant="secondary-outline" size={44}>
        Retry
      </Button>
    ),
  },
};
export const Deload: Story = { args: { tone: 'deload', title: 'Deload week' } };
export const Success: Story = { args: { tone: 'success', title: 'Plan updated' } };
export const PR: Story = {
  args: {
    tone: 'pr',
    title: 'Bench: best estimated 1RM',
    children: '60 × 10 → 80 kg e1RM (was 78)',
  },
};
export const Info: Story = { args: { tone: 'info', title: 'Dinner not logged yet' } };
export const Safety: Story = { args: { tone: 'safety', title: 'Stop and call 999' } };
