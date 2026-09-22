import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { PlanDayRow } from './PlanDayRow';

const meta = { title: 'Components/Workout/PlanDayRow', component: PlanDayRow } satisfies Meta<
  typeof PlanDayRow
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Session: Story = {
  args: {
    kind: 'session',
    day: 'Tue',
    letter: 'B',
    title: 'Push + pull',
    summary: 'Bench press · Lat pulldown · Incline DB press · Seated cable row',
    href: '#',
    onReorder: fn(),
  },
};
export const Rest: Story = { args: { kind: 'rest', day: 'Wed' } };
export const Ride: Story = { args: { kind: 'ride', day: 'Fri' } };
