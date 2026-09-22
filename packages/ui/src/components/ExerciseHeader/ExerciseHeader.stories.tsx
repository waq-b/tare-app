import { displayName, exercise } from '@tare/data';
import type { MovementPattern } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExerciseHeader } from './ExerciseHeader';

const bench = exercise('Barbell_Bench_Press_-_Medium_Grip');
const muscles = [...bench.primary_muscles, ...bench.secondary_muscles].join(' · ');

const meta = {
  title: 'Components/Workout/ExerciseHeader',
  component: ExerciseHeader,
  args: {
    name: displayName(bench),
    muscles: muscles.charAt(0).toUpperCase() + muscles.slice(1),
    pattern: bench.movement_pattern as MovementPattern,
    swapHref: '#',
  },
} satisfies Meta<typeof ExerciseHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Workout: Story = {};
export const Detail: Story = {
  render: (args) => (
    <ExerciseHeader
      name={args.name}
      pattern={args.pattern}
      size="detail"
      muscles="Push · horizontal · Barbell"
    />
  ),
};
