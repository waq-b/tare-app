import type { Meta, StoryObj } from '@storybook/react-vite';
import { Prescription } from './Prescription';

const meta = {
  title: 'Components/Workout/Prescription',
  component: Prescription,
  args: { rx: '3 × 6 @ 62.5' },
} satisfies Meta<typeof Prescription>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Plain: Story = {};
export const Deload: Story = { args: { rx: '2 × 10 @ 60', from: '3 sets', tone: 'deload' } };
