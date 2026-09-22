import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComparisonRow } from './ComparisonRow';

const meta = {
  title: 'Components/Workout/ComparisonRow',
  component: ComparisonRow,
  args: { name: 'Bench press', before: '60 × 10', after: '62.5 × 6', delta: '+2.5 kg' },
} satisfies Meta<typeof ComparisonRow>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Reps: StoryObj<typeof meta> = {
  args: { name: 'Lat pulldown', before: '47.5 × 11', after: '47.5 × 12', delta: '+1 rep' },
};
