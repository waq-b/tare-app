import { exercise } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StepList } from './StepList';

const meta = {
  title: 'Components/Workout/StepList',
  component: StepList,
  args: { steps: exercise('Barbell_Bench_Press_-_Medium_Grip').cues },
} satisfies Meta<typeof StepList>;
export default meta;
export const BenchCues: StoryObj<typeof meta> = {};
