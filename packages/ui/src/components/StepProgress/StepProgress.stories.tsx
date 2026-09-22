import type { Meta, StoryObj } from '@storybook/react-vite';
import { StepProgress } from './StepProgress';

const meta = {
  title: 'Components/Structure/StepProgress',
  component: StepProgress,
  args: { total: 5, done: 2, label: 'Step 2 of 5' },
} satisfies Meta<typeof StepProgress>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Onboarding: Story = {};
export const Exercise: Story = {
  args: { total: 6, done: 0, current: 0, tone: 'text', label: 'Exercise 1 of 6' },
};
export const Weeks: Story = {
  args: {
    total: 4,
    done: 2,
    current: 2,
    label: 'Week 3 of 4 before the first review',
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
  },
};
