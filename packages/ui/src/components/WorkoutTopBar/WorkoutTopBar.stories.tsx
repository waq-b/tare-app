import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkoutTopBar } from './WorkoutTopBar';

const meta = {
  title: 'Components/Workout/WorkoutTopBar',
  component: WorkoutTopBar,
  parameters: { layout: 'fullscreen' },
  args: {
    sessionName: 'Session B · Push + pull',
    elapsed: '12:40',
    minimiseHref: '#',
    flagPainHref: '#',
  },
} satisfies Meta<typeof WorkoutTopBar>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
