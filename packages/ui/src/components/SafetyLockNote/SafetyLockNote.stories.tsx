import type { Meta, StoryObj } from '@storybook/react-vite';
import { SafetyLockNote } from './SafetyLockNote';

const meta = {
  title: 'Components/Safety/SafetyLockNote',
  component: SafetyLockNote,
} satisfies Meta<typeof SafetyLockNote>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const History: StoryObj<typeof meta> = {
  args: {
    children: 'Results come from the safety rules. Your coach reads this list but can’t edit it.',
  },
};
