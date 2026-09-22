import type { Meta, StoryObj } from '@storybook/react-vite';
import { LastTimeStrip } from './LastTimeStrip';

const meta = {
  title: 'Components/Workout/LastTimeStrip',
  component: LastTimeStrip,
  args: { sets: '60 × 10 · 10 · 10', date: 'Tue 15 Sep', effort: 'Hard' },
} satisfies Meta<typeof LastTimeStrip>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
