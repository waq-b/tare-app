import type { Meta, StoryObj } from '@storybook/react-vite';
import { WeekStrip, type WeekDay } from './WeekStrip';

const week: WeekDay[] = [
  { letter: 'M', name: 'Monday 21 September', date: 21, state: 'rest' },
  { letter: 'T', name: 'Tuesday 22 September', date: 22, state: 'planned', today: true },
  { letter: 'W', name: 'Wednesday 23 September', date: 23, state: 'rest' },
  { letter: 'T', name: 'Thursday 24 September', date: 24, state: 'planned' },
  { letter: 'F', name: 'Friday 25 September', date: 25, state: 'ride' },
  { letter: 'S', name: 'Saturday 26 September', date: 26, state: 'planned' },
  { letter: 'S', name: 'Sunday 27 September', date: 27, state: 'rest' },
];

const meta = {
  title: 'Components/Workout/WeekStrip',
  component: WeekStrip,
  args: { days: week },
} satisfies Meta<typeof WeekStrip>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ThisWeek: Story = {};
export const LaterInWeek: Story = {
  args: { days: week.map((d, i) => ({ ...d, today: i === 3, state: i === 1 ? 'done' : d.state })) },
};
export const DeloadWeek: Story = {
  args: { days: week.map((d) => ({ ...d, state: d.state === 'planned' ? 'deload' : d.state })) },
};
