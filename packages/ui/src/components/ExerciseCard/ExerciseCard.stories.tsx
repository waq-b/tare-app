import type { Meta, StoryObj } from '@storybook/react-vite';
import { Prescription } from '../Prescription/Prescription';
import { ExerciseCard, ExerciseCardSkeleton } from './ExerciseCard';

const meta = {
  title: 'Components/Workout/ExerciseCard',
  component: ExerciseCard,
  args: {
    name: 'Bench press',
    pattern: 'push_h',
    subline: 'Warm-up sets included',
    prescription: <Prescription rx="3 × 6 @ 62.5" />,
    href: '#',
  },
} satisfies Meta<typeof ExerciseCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Row: Story = {};
export const Card: Story = { args: { layout: 'card' } };
export const PerHand: Story = {
  args: {
    name: 'Incline DB press',
    subline: 'Per hand',
    prescription: <Prescription rx="3 × 12 @ 16" />,
  },
};
export const Deload: Story = {
  args: { prescription: <Prescription rx="2 × 10 @ 60" from="3 sets" tone="deload" /> },
};
export const Loading: Story = { render: () => <ExerciseCardSkeleton /> };
