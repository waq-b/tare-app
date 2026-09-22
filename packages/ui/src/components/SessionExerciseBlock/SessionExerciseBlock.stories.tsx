import type { Meta, StoryObj } from '@storybook/react-vite';
import { historyOf } from '../../../fixtures';
import { SessionExerciseBlock } from './SessionExerciseBlock';

const last = historyOf('Barbell_Bench_Press_-_Medium_Grip').at(-1);
const work = (last?.sets ?? []).filter((s) => s.kind === 'work');

const meta = {
  title: 'Components/Workout/SessionExerciseBlock',
  component: SessionExerciseBlock,
  args: { name: 'Bench press', sets: work, effort: 'Hard' },
} satisfies Meta<typeof SessionExerciseBlock>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithPR: Story = { args: { pr: true } };
export const PerHand: Story = {
  args: {
    name: 'Incline DB press',
    sets: [
      { load: 16, reps: 12 },
      { load: 16, reps: 12 },
      { load: 16, reps: 12 },
    ],
    loadConvention: 'per_hand',
    effort: 'OK',
  },
};
