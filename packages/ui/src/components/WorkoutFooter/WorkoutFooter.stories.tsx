import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkoutFooter } from './WorkoutFooter';

const meta = {
  title: 'Components/Workout/WorkoutFooter',
  component: WorkoutFooter,
  parameters: { layout: 'fullscreen' },
  args: {
    actionLabel: 'Done',
    actionValue: '62.5 × 6',
    next: { name: 'Lat pulldown', rx: '3 × 12 @ 47.5' },
  },
} satisfies Meta<typeof WorkoutFooter>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Done: Story = {};
export const Finish: Story = { render: () => <WorkoutFooter actionLabel="Finish workout" /> };
